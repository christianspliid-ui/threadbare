/**
 * Culture and spheres showing through — the stated-fact line tables (THR-1635).
 *
 * An encounter's opening stays authored once. At render time one extra sentence is
 * added to the end of its situation-and-complication paragraph, chosen by keys the
 * graph already carries:
 *
 *   - {@link CULTURE_CUSTOMS}`[foundation][reach]` — how the people of the town the
 *     scene plays out in handle this kind of trouble. `foundation` is the culture's
 *     social contract (chaos = honour and challenge, order = written law, light = open
 *     witness, darkness = closed circles).
 *   - {@link SPHERE_FACTS}`[dominantSphere][reach]` — what the place's power does to
 *     this kind of trouble, stated only when that sphere holds at least
 *     {@link SPHERE_FACT_MIN_SHARE} of the place's sphere score.
 *
 * One line per opening, culture first. The decision and its measurements:
 * `Docs/plans/2026-09-27-thr-1635-culture-sphere-openings.md` (from THR-1599).
 *
 * **Authoring rules** — checked by `colorationLineProblems` (doctrine checker) and the
 * table tests:
 *   - one sentence, at most {@link COLORATION_LINE_MAX_WORDS} words;
 *   - it states a custom, a cost or a pressure that bears on the test, never a mood;
 *   - tokens `{actor}`, `{demonym}`, `{place}` only — never `{culture}`, which names the
 *     *actor's* culture, and a stranger in town is exactly where the two differ;
 *   - a sphere line never names its sphere as game jargon ("matter-heavy ground") — say
 *     what the power does;
 *   - a culture cell's variants differ in the custom, not the wording, because they are
 *     what two same-foundation cultures read side by side.
 *
 * `Partial` cells are deliberate: an unauthored cell means no line, never a crash
 * (NFP #4). Slice 2 (THR-1638) authors the remaining reaches and spheres.
 */

import type { ReachDomain } from '../types/traits';
import type { FoundationSphereName, SphereName } from '../types/index';
import { NUDGE_WORD_BUDGETS } from './content-eval/nudgeAuthoringConstants';

// ─── Constants (NFP #1) ────────────────────────────────────────────

/**
 * The dominant sphere's share of a place's total sphere score at or above which the
 * sphere line is stated. Measured on medium worlds (seeds 42 / 99): 0.35 fired on 74%
 * of places (noise); 0.55 fires on 30% · 18%.
 */
export const SPHERE_FACT_MIN_SHARE = 0.55;

/** Variants authored per culture cell; the worldgen stamp takes an ordinal modulo this. */
export const CULTURE_CUSTOM_VARIANTS = 3;

/** Variants authored per sphere cell. */
export const SPHERE_FACT_VARIANTS = 2;

/**
 * Word budget for one added line. Lives in {@link NUDGE_WORD_BUDGETS} as its own row so
 * the doctrine checker counts it separately from the opening's 80.
 */
export const COLORATION_LINE_MAX_WORDS = NUDGE_WORD_BUDGETS.colorationLine;

/** Precedence when both a culture line and a sphere line apply. The decision fixes culture first. */
export const COLORATION_CULTURE_FIRST = true;

/** Tokens a table line may use. `resolveOpeningColoration` fills `{demonym}` and `{place}`;
 *  `{actor}` is left for the rest of `enrichProse`. */
export const COLORATION_ALLOWED_TOKENS: readonly string[] = ['{actor}', '{demonym}', '{place}'];

/** A culture's social contract — its Foundation sphere. */
export type CultureFoundation = FoundationSphereName;

// ─── Culture customs ───────────────────────────────────────────────

export const CULTURE_CUSTOMS: Readonly<
  Record<CultureFoundation, Partial<Record<ReachDomain, readonly string[]>>>
> = {
  chaos: {
    iron: [
      'Among the {demonym}, whoever names a danger first has the right to face it, and three people in {place} have already claimed that right out loud.',
      'The {demonym} settle fear by challenge; if {actor} backs away now, someone else will call it cowardice by nightfall.',
      'The {demonym} give the kill to whoever strikes first, not whoever planned it, so the hunters of {place} are already racing {actor} to it.',
    ],
    stone: [
      'The {demonym} teach a craft by making the student beat the master at it once; the master here has not lost in eleven years.',
      'A {demonym} workshop keeps nothing secret from anyone willing to fight for it, and two rivals are already waiting at the door.',
      'Among the {demonym}, a craft secret changes hands by wager; the smith of {place} will teach {actor} only after losing one.',
    ],
    eye: [
      'The {demonym} have no healers\' guild; the loudest remedy wins, and three are being sold in the square this morning.',
      'Among the {demonym}, whoever brings the answer first takes the credit, and a rival is already asking the same questions.',
      'The {demonym} trust a finding only after its finder defends it in open argument, and the elders of {place} argue to win.',
    ],
  },
  order: {
    iron: [
      '{place} keeps a written ordinance for this: no one approaches until the reeve signs a warrant, and the reeve is two days away.',
      'The {demonym} record every danger in the ward ledger; this one has an entry, a date, and no name beside it.',
      'By {demonym} law, whoever deals with this danger answers for any damage done, and the magistrate of {place} keeps a tally of fines.',
    ],
    stone: [
      'The {demonym} guild rolls list who may learn which technique; {actor} is not on it, and the clerk will not bend.',
      'In {place} a craft passes by indenture only; learning it outside the contract carries a fine the guild collects.',
      'The {demonym} certify a craft by examination; {actor} must pass the guild test in {place}, and the examiners fail half who sit it.',
    ],
    eye: [
      'The {demonym} close a sick quarter by ordinance; the order goes out at dusk whether the illness is named or not.',
      'The reeve of {place} wants a written finding, signed and witnessed, before anyone may act on what {actor} learns.',
      'The {demonym} permit only licensed examiners to inquire into this, and {actor} holds no licence from the council of {place}.',
    ],
  },
  light: {
    iron: [
      'The {demonym} hold that a danger faced in secret is a danger lied about; half of {place} has turned out to watch.',
      'Among the {demonym}, whoever goes in must report everything to the assembly, including what they got wrong.',
      'Among the {demonym}, a danger must be announced before it is faced, so {place} will know exactly when {actor} goes in, and so will the danger.',
    ],
    stone: [
      'The {demonym} teach every craft in the open square; the master will teach {actor}, with the whole town watching every mistake.',
      'A {demonym} craft belongs to everyone, so the secret is no secret; the trouble is that nobody agrees on which version is right.',
      'A {demonym} apprentice must demonstrate each step before the town; one public failure in {place} and no master will take {actor} on again.',
    ],
    eye: [
      'The {demonym} name the sick in public; the families on that list have stopped opening their doors.',
      'The assembly of {place} meets tomorrow and will hear whatever {actor} has found, true or not.',
      'The {demonym} post every finding on the temple door, so whatever {actor} writes down will be read aloud in {place} by evening.',
    ],
  },
  darkness: {
    iron: [
      'The {demonym} do not speak of this thing outside the circle; the circle knows what it is and has chosen not to say.',
      'In {place}, whoever learns what lives here is bound to silence by an oath older than the town.',
      'The {demonym} send one unnamed person against such dangers at night, and {place} will deny {actor} was ever asked.',
    ],
    stone: [
      'The {demonym} pass a craft by initiation; the last step is taught only to those the circle has tested, and {actor} has not been tested.',
      'The {demonym} master will teach the method but not the reason for it, and the reason is the part that matters.',
      'Among the {demonym}, a craft is taught only to kin; {actor} must be adopted into a {place} household before the first lesson.',
    ],
    eye: [
      'The {demonym} tend their sick behind closed doors, and the circle will not say how many there are.',
      'A tribunal of {place} already knows the cause of this and has decided the answer is not for outsiders.',
      'The {demonym} burn written records of such matters; in {place}, anything {actor} learns must be carried in memory alone.',
    ],
  },
};

// ─── Sphere facts ──────────────────────────────────────────────────

/**
 * Keyed by the place's dominant sphere. Force, mind, spirit and chaos cells are not
 * authored: none of them dominated a place on either measured seed, so their lines
 * would never fire (the trace names the cell as `sphere_cell_unauthored` if a later
 * world proves otherwise). The order cells are the prototype's, ported because they
 * cost nothing.
 */
export const SPHERE_FACTS: Readonly<Partial<Record<SphereName, Partial<Record<ReachDomain, readonly string[]>>>>> = {
  life: {
    iron: [
      'Everything that grows around {place} heals too fast; a wound dealt to this thing closes before a second blow can land.',
      'The beasts near {place} grow larger than they should, and this one has been feeding well all season.',
    ],
    stone: [
      'The local craft in {place} works in living material, wood and hide that still grow, and one careless cut kills the stock.',
      'In {place} a graft or a planting takes root overnight, so a mistake in the craft grows along with the work.',
    ],
    eye: [
      'Sickness spreads fast in {place}, where everything living quickens, and recovery comes just as fast to those who survive the first days.',
      'In {place} every living thing multiplies, including whatever carries this illness from house to house.',
    ],
  },
  matter: {
    iron: [
      'The thing is bound into the stone of {place} itself and cannot be driven out, only broken along with the ground it holds.',
      'The ground of {place} resists every spade and lever, so whatever is lodged here cannot be dug out or carried off.',
    ],
    stone: [
      'The stone and ore of {place} take a shape once and will not take another, so {actor} gets one attempt at the work.',
      'Tools wear down fast on the hard stone of {place}; every mistake costs a blade the smith will not replace.',
    ],
    eye: [
      'The illness in {place} lives in the wells and the cellars, not in the air, and it stays where the water stays.',
      'In {place} what is buried stays whole for generations, so the old graves under the square still hold what killed them.',
    ],
  },
  darkness: {
    iron: [
      'The thing cannot be seen in daylight around {place}, only in what it leaves behind after dark.',
      'Lamps burn low and short in {place}; whoever faces this after nightfall faces it nearly blind.',
    ],
    stone: [
      'In {place} the craft is worked at night, and nobody who has watched it done will describe it.',
      'The workshops of {place} keep no windows, and a method learned there is learned by touch, not by sight.',
    ],
    eye: [
      'The sick of {place} hide their symptoms, and the count everyone quotes is far too low.',
      'In {place} people forget what they saw by morning, so every witness to the first cases already remembers it differently.',
    ],
  },
  order: {
    iron: [
      'The thing keeps a strict schedule around {place}, and it has missed none of its appointed nights in living memory.',
      'Whatever this is takes the same path around {place} each time, and anyone who waits at the right spot will meet it.',
    ],
    stone: [
      'The craft in {place} has one correct method, and the master can tell at a glance when a single step is broken.',
      'In {place} work done out of sequence cracks as it cools, so {actor} must learn the whole order before starting.',
    ],
    eye: [
      'The illness spreads along the trade roads from {place} in a regular pattern that someone patient could map.',
      'In {place} the sick fall ill in the same order every season, so the next house on the list can be warned.',
    ],
  },
};

/** Every authored line, with its cell address — the doctrine checker's and tests' sweep. */
export function allColorationLines(): readonly { readonly cell: string; readonly line: string }[] {
  const out: { cell: string; line: string }[] = [];
  for (const [foundation, byReach] of Object.entries(CULTURE_CUSTOMS)) {
    for (const [reach, lines] of Object.entries(byReach ?? {})) {
      for (const line of lines ?? []) out.push({ cell: `culture.${foundation}.${reach}`, line });
    }
  }
  for (const [sphere, byReach] of Object.entries(SPHERE_FACTS)) {
    for (const [reach, lines] of Object.entries(byReach ?? {})) {
      for (const line of lines ?? []) out.push({ cell: `sphere.${sphere}.${reach}`, line });
    }
  }
  return out;
}
