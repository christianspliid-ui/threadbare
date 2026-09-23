/**
 * Artifact Trait Content Package — the two state-carrying traits a *thing* can bear
 * (THR-1521, traits wave 2 slice 3).
 *
 * A trait on an artifact is the Location-trait shape carried one object family
 * further (THR-1143 / THR-790): an ordinary `condition`-category definition whose
 * bearer is an `artifact` / `artifact_legendary` node, declared by the id prefix
 * `trait.artifact.*` rather than by a new category or a new field. The prefix is what
 * the content carve reads (`contentQuery.ts`: a `condition_template` query never deals
 * a mortal *Storied* unless it names `classes: ['artifact']`), what the debug readout
 * filters on, and what the sheet groups under *Traits* rather than *Tags*.
 *
 * **Only two, and why.** `#masterwork` / `#heirloom` / `#stolen` stay family *tags*
 * (THR-1481 seated them): they describe what the thing *is* and never change per
 * bearer. A trait edge is justified only by per-bearer *state* — a level that climbs, a
 * flag that can be set and cleared — and exactly two such states exist today:
 *
 * - `#storied` — the thing has been where things happened. Stamped at level 1 by
 *   `mintMasterwork`; the level climbs as the artifact is present in the encounters its
 *   bearer resolves (`recordArtifactEncounterPresence`, every
 *   `ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL` encounters, to `maxLevel`).
 * - `#cursed` — THR-661's `curse_artifact` wrote `properties.cursed: true`, an untyped
 *   flag read by nobody. The flag stays (the technicalEffect prose and the nullify path
 *   name it), but the *readable* form is now this edge, so `resolveTraitPredicate`
 *   sees a cursed blade the way it sees a wounded mortal. The bearer-side `HiddenMark`
 *   is untouched.
 *
 * `domainContributions` is empty on both, as on every location condition: an artifact
 * has no capability of its own to move — its mechanics live in its own `effects[]`.
 *
 * ─── Constants ──────────────────────────────────────────────────
 * | Name                                  | Default | Purpose                                          |
 * |---------------------------------------|---------|--------------------------------------------------|
 * | ARTIFACT_STORIED_MAX_LEVEL            | 3       | levels of *Storied*; the words below name them   |
 * | ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL | 4       | encounters present per level climb               |
 */

import type { GraphNode } from '../types/graph';
import type { TraitDefinitionProperties } from '../types/traits';

// ─── Ids ────────────────────────────────────────────────────────────────────

/**
 * The id namespace that declares a definition an *artifact's*. Everything under it is
 * a thing's trait; nothing else is — the same declaration-by-prefix rule as
 * `LOCATION_CONDITION_ID_PREFIX`, and for the same reason: no second discriminator
 * on a 337-importer type.
 */
export const ARTIFACT_TRAIT_ID_PREFIX = 'trait.artifact.';

export const ARTIFACT_STORIED_TRAIT_ID = `${ARTIFACT_TRAIT_ID_PREFIX}storied`;
export const ARTIFACT_CURSED_TRAIT_ID = `${ARTIFACT_TRAIT_ID_PREFIX}cursed`;

// ─── Tunables ───────────────────────────────────────────────────────────────

/** Levels *Storied* can climb to. Words only on any surface (Law 13). */
export const ARTIFACT_STORIED_MAX_LEVEL = 3;

/**
 * Encounters an artifact must be present in per level of *Storied*. Level 1 is the
 * mint; the first climb comes after this many encounters, the second after twice.
 */
export const ARTIFACT_STORIED_ENCOUNTERS_PER_LEVEL = 4;

/**
 * The level words a surface shows instead of a numeral — indexed by `level - 1`.
 * Keyed by trait id so a second scaled artifact trait adds a row, not a branch.
 */
export const ARTIFACT_TRAIT_LEVEL_WORDS: Readonly<Record<string, readonly string[]>> = {
  [ARTIFACT_STORIED_TRAIT_ID]: ['has seen a thing or two', 'has seen much', 'has seen it all'],
  [ARTIFACT_CURSED_TRAIT_ID]: ['the harm comes with the having'],
};

/** The level word for a trait at a level, clamped to the words that exist; null when the trait has none. */
export function artifactTraitLevelWord(traitId: string, level: number): string | null {
  const words = ARTIFACT_TRAIT_LEVEL_WORDS[traitId];
  if (!words || words.length === 0) return null;
  const index = Math.min(Math.max(Math.floor(level), 1), words.length) - 1;
  return words[index] ?? null;
}

// ─── Definitions ────────────────────────────────────────────────────────────

/**
 * The two definitions. Seeded at world init through `seedEncounterTraitDefinitions`
 * (they join `ENCOUNTER_TRAIT_DEFINITIONS`) and re-seeded on demand by
 * `assignArtifactTrait` for a world saved before this slice or a fixture graph.
 *
 * Both carry `#condition` (family) and a polarity, which is what `check:attachment`
 * requires of every Condition entry; `#storied` and `#cursed` are the refs a trait
 * gate names them by (`requiredTraits: [{ traitId: '#cursed' }]`).
 */
export const ARTIFACT_TRAIT_DEFINITIONS: readonly GraphNode[] = [
  {
    id: ARTIFACT_STORIED_TRAIT_ID,
    type: 'trait',
    name: 'Storied',
    properties: {
      subcategory: 'condition',
      description: 'This thing has been where things happened. Every encounter it was carried through is another tale told about it, and the tales are starting to be told.',
      importance: 0.5,
      maxLevel: ARTIFACT_STORIED_MAX_LEVEL,
      visibility: 'public',
      // A thing has no capability to move; its mechanics are its own effects.
      domainContributions: {},
      tags: ['#condition', '#storied', '#positive'],
      flavorText: 'Ask anyone who was there. They will tell you it was this one.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
  {
    id: ARTIFACT_CURSED_TRAIT_ID,
    type: 'trait',
    name: 'Cursed',
    properties: {
      subcategory: 'condition',
      description: 'A curse rides in this thing. Whoever holds it is quietly drained, and is not told.',
      importance: 0.7,
      maxLevel: 1,
      visibility: 'discoverable',
      domainContributions: {},
      tags: ['#condition', '#cursed', '#curse', '#negative'],
      flavorText: 'It was never the blade that was unlucky. It was whoever carried it.',
      censusTag: { scale: 'local' },
    } satisfies TraitDefinitionProperties,
  },
];

/** Every artifact-trait id, derived from the definitions so a third definition joins by construction. */
export const ARTIFACT_TRAIT_IDS: readonly string[] = ARTIFACT_TRAIT_DEFINITIONS.map(n => n.id);

/** True when `traitId` names an artifact's trait — the prefix is the declaration. */
export function isArtifactTraitId(traitId: string): boolean {
  return traitId.startsWith(ARTIFACT_TRAIT_ID_PREFIX);
}
