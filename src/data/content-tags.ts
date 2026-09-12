/**
 * The closed tag vocabulary — every word an author may hang on a piece of content
 * (THR-1486, slice 2 of THR-1481).
 *
 * **Why a closed list.** Content references content by literal id today, and literal
 * ids rot. The fix is to name content by *kind and tags* — but a tag vocabulary that
 * anyone may extend by typing is not a vocabulary, it is a folksonomy: the corpus that
 * seeded this file held one hundred and fifty-three distinct spellings, sixty-two of
 * them carried by one or two entries and read by nothing. A query written against a
 * folksonomy matches whatever the last author happened to type.
 *
 * **Five axes, two of them derived.** `reach` and `sphere` are generated from
 * `REACH_DOMAINS` and `SPHERE_NAMES` rather than restated, so a ninth reach or a
 * thirteenth sphere appears here the day it is added — and its description is owed at
 * compile time, because {@link REACH_TAG_DESCRIPTIONS} and {@link SPHERE_TAG_DESCRIPTIONS}
 * are total `Record`s over those unions. `polarity` is the two words the condition
 * proxy-event classifier already reads. `form` and `family` are authored.
 *
 * **What the axes mean.**
 * - `form` — what the thing *is*: a blade, a tome, a mount, a ration.
 * - `family` — what class of story-object it belongs to: a relic, a curse, a wound,
 *   a thing of the wilds, a thing of the court.
 * - `reach` / `sphere` — the cosmology's own two axes, projected from a typed field
 *   wherever one exists (see the registry's `projections` column) and authored only
 *   where none does.
 * - `polarity` — whether the thing is good or ill to carry.
 *
 * `family` is the wide one, and deliberately so: it holds both "what kind of object"
 * (`#relic`, `#trinket`) and "what walk of life" (`#combat`, `#knowledge`, `#trade`).
 * Those read as two ideas and the corpus treats them as one — an entry carries
 * `#weapon` *and* `#combat`, never one instead of the other. Splitting them is a
 * sixth axis, which is a design decision and not this slice's to take; the strain is
 * recorded here so the next reader finds the question already asked.
 *
 * **The axis is presentation and completeness, never query semantics.** The resolver
 * (slice 3) matches tags, not axes. An axis decides how a chip is grouped on a player
 * surface and which axes a kind must carry (`requiredAxes`); it never changes what a
 * query returns. A tag seated on the wrong axis is therefore a legibility defect, not
 * a behaviour one — cheap to correct, which is why this file could be seated in one
 * pass rather than waiting on a perfect taxonomy.
 *
 * **Seating rule (the migration's, recorded so it is not re-derived).** A spelling in
 * the corpus survives when it has at least one runtime reader — a `tagFilters` query
 * site or a hardcoded read — **or** at least {@link CONTENT_TAG_MIN_BEARERS} bearers
 * across the catalogs. Everything else was removed from its entries. A bare spelling
 * (`legendary`, `road`) was rewritten with its `#`; a spelling that named a reach or a
 * sphere moved onto the derived axis. Six tags are seated on readers alone and carry no
 * bearer at all — the generated catalog badges them **DEAD** and the weekly retro
 * deletes them under the sunset rule, which is the point of badging rather than hiding.
 *
 * **Adding a tag is a design-session decision**, recorded on `Docs/canon/content-objects.md`
 * — the same governance the encounter catalogs carry. Adding one here without a bearer
 * ships a DEAD row; adding one to an entry without seating it here fails
 * `contentTags.test.ts` by name.
 */
import { REACH_DOMAINS, type ReachDomain } from '../types/traits';
import { SPHERE_NAMES, type SphereName } from '../types/index';
import type { ContentObjectKindId, ContentTagAxis } from './content-objects';

export type { ContentTagAxis } from './content-objects';

// ─── Shapes ─────────────────────────────────────────────────────────

/**
 * Every tag carries its `#`. The library has always written `'#weapon'`; `'weapon'`
 * matches nothing (THR-1146), which is why the migration rewrote the bare spellings
 * rather than teaching the matcher to accept both.
 */
export type ContentTag = `#${string}`;

export interface ContentTagDef {
  readonly tag: ContentTag;
  readonly axis: ContentTagAxis;
  /** Plain-register, ≤ {@link TAG_DESCRIPTION_MAX_CHARS}; becomes the `tag.<name>` tooltip. */
  readonly description: string;
  /** Kinds this tag may appear on; omitted means any kind. */
  readonly kinds?: readonly ContentObjectKindId[];
}

// ─── Tunable constants (NFP #1) ─────────────────────────────────────

/**
 * Seating rule: a spelling with fewer bearers than this and no runtime reader was
 * retired rather than seated. Three is the point at which a spelling has stopped
 * being one author's word for one entry and started being the corpus's.
 */
export const CONTENT_TAG_MIN_BEARERS = 3;

/**
 * Generated-catalog badge threshold: a tag with this many bearers is **DEAD** and the
 * weekly retro deletes it. Zero — a tag nothing wears is a query nothing can answer.
 */
export const CONTENT_TAG_DEAD_BEARERS = 0;

/** The tooltip ceiling the rest of the registry already holds (`tooltipValidation.test.ts`). */
export const TAG_DESCRIPTION_MAX_CHARS = 200;

/** The tooltip prefix a tag resolves under: `#weapon` → `tag.weapon`. */
export const CONTENT_TAG_TOOLTIP_PREFIX = 'tag';

// ─── Derived axes ───────────────────────────────────────────────────

/**
 * One line per reach, in the game's words. Total over `ReachDomain`, so a ninth reach
 * fails the typecheck here rather than shipping a tag with no explanation.
 */
export const REACH_TAG_DESCRIPTIONS: Readonly<Record<ReachDomain, string>> = {
  iron: 'Of force and arms — a thing meant for the fight, or marked by one.',
  gold: 'Of trade and worth — a thing bought, bartered, or counted.',
  shadow: 'Of stealth and secrets — a thing that keeps quiet, or keeps something quiet.',
  veil: 'Of the unseen — a thing touched by what lies behind the world.',
  heart: 'Of bonds and feeling — a thing that moves people, or is moved by them.',
  eye: 'Of watching and knowing — a thing that sees further than it should.',
  stone: 'Of craft and endurance — a thing built to last, or built to build.',
  star: 'Of lore and the far pattern — a thing that answers to what is written above.',
};

/**
 * One line per sphere. Total over `SphereName`, so a thirteenth sphere is owed a
 * description before it can ship.
 */
export const SPHERE_TAG_DESCRIPTIONS: Readonly<Record<SphereName, string>> = {
  chaos: 'Sworn to Chaos — unruly, and apt to become something it was not.',
  order: 'Sworn to Order — it holds its shape, and holds others to theirs.',
  light: 'Sworn to Light — it reveals, warms, and is hard to hide behind.',
  darkness: 'Sworn to Darkness — it conceals, and asks nothing about what it hides.',
  force: 'Of Force — it pushes, strikes, or refuses to be moved.',
  matter: 'Of Matter — solid, worked, and stubbornly itself.',
  energy: 'Of Energy — it burns, quickens, or spends itself to act.',
  life: 'Of Life — it grows, heals, or wants to keep growing.',
  mind: 'Of Mind — it thinks, remembers, or leans on the thoughts of others.',
  spirit: 'Of Spirit — it answers to devotion rather than to hands.',
  time: 'Of Time — it wears, waits, or keeps a reckoning of its own.',
  entropy: 'Of Entropy — it unmakes, and is patient about it.',
};

const derivedReachTags: readonly ContentTagDef[] = REACH_DOMAINS.map(reach => ({
  tag: `#${reach}` as ContentTag,
  axis: 'reach' as const,
  description: REACH_TAG_DESCRIPTIONS[reach],
}));

const derivedSphereTags: readonly ContentTagDef[] = SPHERE_NAMES.map(sphere => ({
  tag: `#${sphere}` as ContentTag,
  axis: 'sphere' as const,
  description: SPHERE_TAG_DESCRIPTIONS[sphere],
}));

const polarityTags: readonly ContentTagDef[] = [
  { tag: '#positive', axis: 'polarity', description: 'A good thing to carry — it helps the one who holds it.' },
  { tag: '#negative', axis: 'polarity', description: 'An ill thing to carry — it costs the one who holds it.' },
];

// ─── Authored axes ──────────────────────────────────────────────────

const T = (
  tag: ContentTag,
  axis: 'form' | 'family',
  description: string,
  kinds?: readonly ContentObjectKindId[],
): ContentTagDef => (kinds ? { tag, axis, description, kinds } : { tag, axis, description });

/** What the thing *is* — its shape in a mortal's hands. */
const formTags: readonly ContentTagDef[] = [
  T('#weapon', 'form', 'A thing made to wound.'),
  T('#melee', 'form', 'Meant for close work, where the fight is decided by reach of arm.'),
  T('#ranged', 'form', 'Meant to strike from across the ground between.'),
  T('#precision', 'form', 'Made for the exact cut rather than the heavy one.'),
  T('#cloth', 'form', 'Cloth and leather — worn, not wielded.'),
  T('#tome', 'form', 'A bound book, heavy with what someone wrote down.'),
  T('#scroll', 'form', 'A single sheet, rolled — one working, one reading.'),
  T('#map', 'form', 'A drawing of somewhere, made by someone who went there.'),
  T('#talisman', 'form', 'Small, worn close, and meant to be believed in.'),
  T('#gem', 'form', 'A cut stone, worth more than its weight.'),
  T('#crystal', 'form', 'Grown rather than cut, and rarely inert.'),
  T('#pearl', 'form', 'Drawn from deep water, and never the same twice.'),
  T('#herb', 'form', 'Cut, dried, and kept for what it does.'),
  T('#fungus', 'form', 'Grown in the dark, and seldom entirely safe.'),
  T('#flesh', 'form', 'Of the body — borne in it rather than carried.'),
  T('#beast', 'form', 'A living creature, not a made thing.'),
  T('#mount', 'form', 'Ridden — it carries its bearer as much as the reverse.'),
  T('#tool', 'form', 'Made for work rather than for war.'),
  T('#equipment', 'form', 'Gear for the road and the task: rope, lantern, kit.'),
  T('#provision', 'form', 'Food, drink, and the rest of what keeps a body going.'),
  T('#carrying', 'form', 'A pack, a case, a hold — made to bear other things.'),
  T('#ward', 'form', 'Set against something: a charm, a seal, a line not crossed.'),
  T('#star_metal', 'form', 'Fallen metal, worked by someone who knew what they had.'),
];

/** What class of story-object it belongs to — the word a codex entry would use. */
const familyTags: readonly ContentTagDef[] = [
  // Kinds of object
  T('#relic', 'family', 'Old, singular, and heavy with whoever held it before.'),
  T('#trinket', 'family', 'Small and slight — worth more as a token than as a thing.'),
  T('#legendary', 'family', 'Known by name across the world, and not by many hands.'),
  T('#consumable', 'family', 'Used once and gone.'),
  T('#anomaly', 'family', 'Left behind by something the world does not explain.'),
  T('#ancient', 'family', 'From before the present order — older than the people who use it.'),
  T('#creation', 'family', 'Made deliberately, by a hand that meant it.'),
  T('#bestowed', 'family', 'Given by a god rather than found or made.'),
  T('#anti-magic', 'family', 'It refuses the unseen, or blunts what draws on it.'),

  // Kinds of condition
  T('#blessing', 'family', 'A favour that rides along, for as long as it lasts.'),
  T('#curse', 'family', 'A weight laid on someone, and not easily set down.'),
  T('#cursed', 'family', 'It carries a curse with it — the harm comes with the having.'),
  T('#wound', 'family', 'Hurt taken, and still healing or still open.'),
  T('#disease', 'family', 'A sickness in the body, which spreads if it can.'),
  T('#physical', 'family', 'Of the body rather than the mind or the soul.'),

  // The unseen
  T('#divine', 'family', 'Of the gods — it answers to worship, not to craft.'),
  T('#arcane', 'family', 'Of learned working — known by study rather than by gift.'),
  T('#supernatural', 'family', 'Beyond the ordinary run of things, without saying how.'),
  T('#mystical', 'family', 'Half-understood even by those who use it.'),
  T('#nature', 'family', 'Of growing things and the weather they grow under.'),
  T('#fate', 'family', 'It touches what is coming rather than what is here.'),
  T('#vision', 'family', 'It shows what is not in front of the eye.'),
  T('#temporal', 'family', 'It works on time — delaying, hastening, or remembering.'),

  // Walks of life
  T('#combat', 'family', 'Of fighting — carried into it, or earned there.'),
  T('#knowledge', 'family', 'Of learning — what is written, taught, or worked out.'),
  T('#craft', 'family', 'Of making — the trades, and the hands that keep them.'),
  T('#healing', 'family', 'Of mending people.'),
  T('#restoration', 'family', 'Of putting back what was taken or broken.'),
  T('#survival', 'family', 'Of staying alive where staying alive is the work.'),
  T('#stealth', 'family', 'Of going unseen and unheard.'),
  T('#social', 'family', 'Of people and standing — it works through others.'),
  T('#trade', 'family', 'Of buying and selling.'),
  T('#commercial', 'family', 'Of the counting-house — contracts, ledgers, and terms.'),
  T('#travel', 'family', 'Of the road, and of getting somewhere else.'),
  T('#discovery', 'family', 'Of finding what nobody had found.'),
  T('#patronage', 'family', 'Of being owed a favour by someone who matters.'),
  T('#stewardship', 'family', 'Of holding something in trust for other people.'),
  T('#community', 'family', 'Of the many rather than the one.'),
  T('#military', 'family', 'Of armies — muster, march, and command.'),
  T('#supply', 'family', 'Of what an army or a town must be fed and armed with.'),
  T('#territorial', 'family', 'Of ground held, claimed, or argued over.'),

  // Places a thing belongs to
  T('#wilderness', 'family', 'Of the unsettled country.'),
  T('#wilds', 'family', 'Of the deep wild, past where the roads go.'),
  T('#ruins', 'family', 'Of places that were something else first.'),
  T('#ruin_seeker', 'family', 'For those who go into ruins on purpose.'),
  T('#settlement', 'family', 'Of towns and the lives lived in them.'),
  T('#road', 'family', 'Of the ways between places.'),
  T('#court', 'family', 'Of halls, titles, and who is standing where.'),
  T('#checkpoint', 'family', 'Of the place where someone asks you what you are carrying.'),

  // Things best not carried openly
  T('#contraband', 'family', 'Forbidden to hold, whoever you are holding it for.'),
  T('#blackmail_evidence', 'family', 'Proof of something someone would pay to bury.'),
];

/**
 * The families an encounter belongs to (THR-1488, slice 4 of THR-1481).
 *
 * **What these replace.** A sequel used to be planted by *id prefix* —
 * `encounterFamily: 'ac.quest'` — and the prefix rots the way a literal id does, one
 * level up. Measured over the shipped corpus on 2026-09-12: of the fifty-one families
 * the aftermath authors name, **forty-one match no template at all**, so forty-one
 * kinds of promised follow-up have been withering silently since they were written.
 * Naming the family as a word the codex would use means a renamed member keeps its
 * family and a newly authored one joins by carrying the tag.
 *
 * **Why they are game words and not id spellings.** `#ac_quest` would be the same
 * rot wearing a `#`: it names a file's naming convention rather than a thing in the
 * world. A mortal running an errand for the Arcane Circle is running a *circle
 * errand*; that is the phrase, and it survives the id being spelled differently
 * tomorrow. `ENCOUNTER_FAMILY_TAGS` in `src/engine/encounterSeeding.ts` maps the old
 * prefix onto the tag for one release so shipped seeds keep resolving.
 *
 * **Why the thin families are seated anyway.** Three of these carry fewer than
 * {@link CONTENT_TAG_MIN_BEARERS} bearers (`#threshold_errand` two, `#broker_errand`
 * and `#craft_commission` one each). The seating rule's first clause admits them: a
 * spelling survives on *at least one runtime reader* independent of bearer count, and
 * these each have one — an authored seed in the shipped corpus that names the family
 * and, before this slice, resolved to a template by prefix. Retiring them would break
 * the only sequels on this list that work today.
 *
 * All are scoped to `encounter_template`: an item has no errand to run.
 */
const encounterFamilyTags: readonly ContentTagDef[] = [
  // The twelve faction quest families — the body that sets the errand, in its word.
  T('#guild_errand', 'family', 'Work set by the Adventurers\' Guild — a posting taken off the board.', ['encounter_template']),
  T('#circle_errand', 'family', 'Work set by the Arcane Circle — study, survey, and the reagents study needs.', ['encounter_template']),
  T('#fellowship_errand', 'family', 'Work set by the Builders\' Fellowship — stone cut, walls held, bridges thrown.', ['encounter_template']),
  T('#watch_errand', 'family', 'Work set by the Civic Guard — the patrol, the gate, the crime nobody has solved.', ['encounter_template']),
  T('#dawn_errand', 'family', 'Work set by the Holy Order of the Dawn — rites kept and the unclean turned back.', ['encounter_template']),
  T('#covenant_errand', 'family', 'Work set by the Lorekeepers\' Covenant — what is written down, and keeping it.', ['encounter_template']),
  T('#company_errand', 'family', 'Work set by a Mercenary Company — the contract, the escort, the bounty.', ['encounter_template']),
  T('#consortium_errand', 'family', 'Work set by the Merchant Consortium — cargo, routes, and the terms they travel under.', ['encounter_template']),
  T('#ranger_errand', 'family', 'Work set by the Rangers\' Brotherhood — the border, the trail, the thing that crossed it.', ['encounter_template']),
  T('#temple_errand', 'family', 'Work set by the Temple of Spheres — observance, offering, and the spheres\' own asking.', ['encounter_template']),
  T('#thieves_errand', 'family', 'Work set by the Thieves\' Guild — quiet, deniable, and paid in kind.', ['encounter_template']),
  T('#court_errand', 'family', 'Work set by the Underking\'s Court — a favour asked by someone who does not ask.', ['encounter_template']),

  // Families that are not a faction's posting.
  T('#tavern_night', 'family', 'An evening in a common room, and whatever the evening turns into.', ['encounter_template']),
  T('#delve', 'family', 'A descent into somewhere closed — a ruin, a vault, a hole that goes down.', ['encounter_template']),
  T('#threshold_errand', 'family', 'Work at a crossing place, where the road or the world changes hands.', ['encounter_template']),
  T('#broker_errand', 'family', 'Work arranged by someone who trades in arrangements rather than goods.', ['encounter_template']),
  T('#craft_commission', 'family', 'A piece of work ordered from a maker, and answerable to whoever ordered it.', ['encounter_template']),
];

// ─── The vocabulary ─────────────────────────────────────────────────

export const CONTENT_TAGS: readonly ContentTagDef[] = [
  ...derivedReachTags,
  ...derivedSphereTags,
  ...polarityTags,
  ...formTags,
  ...familyTags,
  ...encounterFamilyTags,
];

const BY_TAG: ReadonlyMap<string, ContentTagDef> = new Map(CONTENT_TAGS.map(d => [d.tag, d]));

// ─── Readers ────────────────────────────────────────────────────────

/** The definition for a tag, or `undefined` when the spelling is not in the vocabulary. */
export function getContentTag(tag: string): ContentTagDef | undefined {
  return BY_TAG.get(tag);
}

/** True when the spelling is seated. The one predicate every gate asks. */
export function isContentTag(tag: string): tag is ContentTag {
  return BY_TAG.has(tag);
}

/** Every seated tag on one axis, in vocabulary order. */
export function contentTagsOnAxis(axis: ContentTagAxis): readonly ContentTagDef[] {
  return CONTENT_TAGS.filter(d => d.axis === axis);
}

/** The axis a seated tag sits on, or `null` for a spelling outside the vocabulary. */
export function axisOfContentTag(tag: string): ContentTagAxis | null {
  return BY_TAG.get(tag)?.axis ?? null;
}

/**
 * The tooltip id for a tag — `#weapon` → `tag.weapon`. The `#` is the vocabulary's
 * marker, not part of the name, and a tooltip id carrying one would not survive the
 * resolver's `split('.')` routing intact.
 */
export function contentTagTooltipId(tag: ContentTag): string {
  return `${CONTENT_TAG_TOOLTIP_PREFIX}.${tag.slice(1)}`;
}

/** The tag a `tag.*` tooltip id names, or `undefined` when the suffix is not seated. */
export function contentTagFromTooltipSuffix(suffix: string): ContentTagDef | undefined {
  return BY_TAG.get(`#${suffix}`);
}
