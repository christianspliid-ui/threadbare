/**
 * The Consequence Draw — reach-weighted primitive tables for the factory. THR-1145.
 *
 * Plan: `Docs/plans/2026-08-16-consequence-palette-expansion.md` § The
 * Consequence Draw. Director direction, 2026-08-16: *"a little simple randomizer
 * for the encounter writing factory that randomly assigns a set of primitives
 * that need to be used in context … HEART encounters should have a larger chance
 * of spawning allies or build relationships … gold encounters should have a
 * larger chance of spawning items … most primitives could potentially show up in
 * most types of encounters although chances may vary."*
 *
 * **What this is for.** The palette census behind THR-1141 found the corpus
 * spending nearly all its consequences on a handful of favorites — an item, a
 * reputation delta, a condition — while a dozen shipped primitives went almost
 * unused. That is not an authoring failure so much as a default: asked to invent
 * a consequence, anyone reaches for the nearest one. So the factory rolls the
 * hand instead. At brief time the pipeline draws two families (three at rarity
 * ≥ 3), and the encounter must find room for each *in context*.
 *
 * **The floor is the design.** Every cell of the weight matrix is ≥ 1, so any
 * family can surface in any reach — the weights carry the reach's flavor, the
 * floor carries the variety. A matrix with zeroes would produce eight rigid
 * genres, which is the same convergence problem one level up.
 *
 * **Recomputable, therefore tamper-evident.** The hand is a pure function of the
 * template id, its reach and its rarity tier. A template records what it drew;
 * `check:encounter` recomputes and compares. An author who dislikes their hand
 * cannot quietly rewrite it — they take the one recorded swap, which says what
 * was traded and why.
 *
 * **Pure and authoring-time.** No graph, no fs, no runtime, no tick-loop code.
 * The draw never runs in the simulation; it runs in the brief and in the gate.
 */

import type { ReachDomain } from '../../types/traits';
import type { RarityTier } from '../../types/rarity';
import type {
  EncounterAftermathReactionEffect,
  UnifiedActionTemplate,
} from '../../types/unifiedAction';
import { drawFromTable } from './drawTable';

// ─── Constants (NFP #1 — every magic number is named) ────────────────

/** Table id, mixed into the seed so this draw is independent of later tables. */
export const CONSEQUENCE_TABLE_ID = 'consequence';

/** Families drawn per encounter. */
export const CONSEQUENCE_HAND_BASE = 2;

/** Rarity tier at which the hand grows by one. */
export const CONSEQUENCE_HAND_RARITY_BONUS_TIER = 3;

/**
 * Rarity floor for the `formative` family.
 *
 * The axiological mark is author-gated and rare by design; the table respects
 * that law rather than fighting it, so a tier-1 encounter can never draw a
 * consequence it is not allowed to author.
 */
export const CONSEQUENCE_FORMATIVE_MIN_TIER = 3;

/** Minimum table weight a swap target must hold in that reach. */
export const CONSEQUENCE_SWAP_MIN_WEIGHT = 2;

// ─── The families ────────────────────────────────────────────────────

/**
 * The fifteen consequence families.
 *
 * A *family* is a kind of thing that can happen to someone, named the way a
 * player would recognise it — not an effect kind. One family maps to several
 * effect kinds (see {@link CONSEQUENCE_FAMILY_EFFECT_KINDS}), which is the point:
 * the draw tells an author *what kind of consequence* to find room for and
 * leaves the mechanism to them.
 */
export type ConsequenceFamily =
  | 'relationship'
  | 'companion'
  | 'standing'
  | 'possession'
  | 'condition'
  | 'knowledge'
  | 'secret'
  | 'story_seed'
  | 'thread'
  | 'drive'
  | 'movement'
  | 'place'
  | 'membership'
  | 'omen'
  | 'formative';

/**
 * Canonical order — the plan's table order, so a hand reads identically
 * wherever it is printed (NFP #3).
 */
export const CONSEQUENCE_FAMILIES: readonly ConsequenceFamily[] = [
  'relationship',
  'companion',
  'standing',
  'possession',
  'condition',
  'knowledge',
  'secret',
  'story_seed',
  'thread',
  'drive',
  'movement',
  'place',
  'membership',
  'omen',
  'formative',
];

/**
 * The per-reach flavor. Tuning the game's consequence texture is editing this
 * table and nothing else (NFP #1).
 *
 * Reading the columns as identities: **iron** wounds and earns standing; **gold**
 * owns things, owes favors, holds rank; **shadow** knows secrets and starts
 * stories it doesn't sign; **veil** blesses, curses, consecrates places, and
 * reads omens; **heart** binds people — allies, companions, communities; **eye**
 * knows, uncovers, and opens mysteries; **stone** makes things and changes
 * places; **star** is fate — seeds, threads, compulsions, journeys, defining
 * moments.
 *
 * Every cell is ≥ 1 on purpose (see the module header). Adding or removing a
 * *family* is a design decision needing a note to the director; changing a
 * *number* is calibration and needs no ruling.
 */
export const CONSEQUENCE_FAMILY_WEIGHTS: Readonly<
  Record<ConsequenceFamily, Readonly<Record<ReachDomain, number>>>
> = {
  //              iron gold shadow veil heart eye stone star
  relationship: { iron: 5, gold: 4, shadow: 4, veil: 3, heart: 10, eye: 3, stone: 4, star: 3 },
  companion: { iron: 5, gold: 3, shadow: 2, veil: 2, heart: 9, eye: 2, stone: 3, star: 3 },
  standing: { iron: 7, gold: 8, shadow: 2, veil: 3, heart: 5, eye: 4, stone: 5, star: 3 },
  possession: { iron: 5, gold: 10, shadow: 5, veil: 4, heart: 2, eye: 4, stone: 9, star: 2 },
  condition: { iron: 8, gold: 2, shadow: 5, veil: 9, heart: 4, eye: 2, stone: 4, star: 4 },
  knowledge: { iron: 2, gold: 4, shadow: 7, veil: 4, heart: 2, eye: 10, stone: 4, star: 5 },
  secret: { iron: 3, gold: 7, shadow: 10, veil: 4, heart: 4, eye: 7, stone: 2, star: 3 },
  story_seed: { iron: 5, gold: 5, shadow: 7, veil: 5, heart: 7, eye: 7, stone: 4, star: 10 },
  thread: { iron: 3, gold: 2, shadow: 2, veil: 6, heart: 5, eye: 3, stone: 2, star: 8 },
  drive: { iron: 4, gold: 4, shadow: 6, veil: 6, heart: 4, eye: 5, stone: 4, star: 8 },
  movement: { iron: 4, gold: 5, shadow: 5, veil: 2, heart: 4, eye: 5, stone: 2, star: 7 },
  place: { iron: 4, gold: 4, shadow: 3, veil: 7, heart: 4, eye: 3, stone: 10, star: 4 },
  membership: { iron: 5, gold: 7, shadow: 6, veil: 3, heart: 6, eye: 3, stone: 6, star: 2 },
  omen: { iron: 1, gold: 1, shadow: 2, veil: 8, heart: 1, eye: 4, stone: 1, star: 8 },
  formative: { iron: 4, gold: 2, shadow: 3, veil: 4, heart: 5, eye: 2, stone: 3, star: 6 },
};

/**
 * The concrete effect kinds that satisfy each family.
 *
 * **This is a floor, not a semantic match** — the same discipline
 * `chipBackingViolations` states for Law 56. The gate asks whether the encounter
 * wires *any* effect from the family's row; it cannot ask whether that effect is
 * the one the fiction wanted, because no machine reads the fiction. Two
 * consequences follow, both deliberate:
 *
 * - `attachment_grant` sits in **both** `possession` and `condition`, because
 *   which one it is depends on the granted template's category — content the
 *   gate does not resolve. A template granting an attachment satisfies either.
 * - `place` and `condition` share the condition kinds, separated at check time
 *   by whether the effect carries a location target (THR-1143's `targetLocationId`).
 *   That distinction *is* machine-readable, so it is made — see
 *   {@link familiesWiredByEffects}.
 *
 * **Typed to the effect union on purpose, not to `string`.** A misspelled kind
 * here would make its family permanently unwirable — every encounter that drew it
 * would go red with no authoring that could satisfy the gate, and nothing at
 * runtime would ever notice, because this table is only ever *read* against live
 * effects. That is the THR-844 rot class exactly ("a filter matching zero
 * templates is a silently empty pool"), and the union annotation turns it into a
 * compile error instead of a test somebody has to think to write.
 */
export const CONSEQUENCE_FAMILY_EFFECT_KINDS: Readonly<
  Record<ConsequenceFamily, readonly EncounterAftermathReactionEffect['kind'][]>
> = {
  relationship: ['bond_change'],
  companion: ['grant_companion', 'remove_companion'],
  standing: ['reputation_score', 'reputation_tally', 'reputation_set', 'faction_reputation_gain', 'reputation_with'],
  possession: ['spawn_artifact', 'attachment_grant', 'reward_draw'],
  condition: ['condition_attachment', 'apply_condition', 'remove_condition', 'attachment_grant'],
  knowledge: ['intelligence', 'spawn_clue'],
  secret: ['hidden_mark', 'secret_discovery', 'favor_creation'],
  story_seed: ['encounter_seed'],
  thread: ['thread_strengthen', 'thread_weaken', 'thread_break', 'thread_branch'],
  drive: ['assign_ambition', 'plant_compulsion'],
  movement: ['agent_relocation'],
  place: ['spawn_unique_location', 'condition_attachment', 'apply_condition', 'remove_condition'],
  membership: ['membership_change'],
  omen: ['emit_omen'],
  formative: ['axiological_mark_apply'],
};

/**
 * Whether a recorded name is a real family.
 *
 * The template fields are typed `string` (so `src/types/` need not import
 * `src/data/`), which makes every read of them a narrowing site. Exported
 * because the CLI validates its `--swap-to` argument the same way.
 */
export function isConsequenceFamily(value: string): value is ConsequenceFamily {
  return (CONSEQUENCE_FAMILIES as readonly string[]).includes(value);
}

/** The condition kinds that land on a place when they carry a location target. */
const LOCATION_CARRYING_CONDITION_KINDS: ReadonlySet<string> = new Set([
  'condition_attachment',
  'apply_condition',
  'remove_condition',
]);

// ─── The draw ────────────────────────────────────────────────────────

/** What the draw needs from a template — spelled out so the CLI can pass it directly. */
export interface ConsequenceDrawInput {
  readonly templateId: string;
  readonly reach: ReachDomain;
  readonly rarityTier: RarityTier;
}

/** Hand size for a rarity tier. */
export function consequenceHandSize(rarityTier: RarityTier): number {
  return CONSEQUENCE_HAND_BASE + (rarityTier >= CONSEQUENCE_HAND_RARITY_BONUS_TIER ? 1 : 0);
}

/**
 * The hand this template draws. Pure, seeded, and recomputable from the id.
 *
 * Sorted into {@link CONSEQUENCE_FAMILIES} order rather than left in draw order:
 * the hand is a *set* of things to find room for, and nothing downstream reads
 * an ordering, so returning one would invite a gate that compares arrays and
 * fails an author who wrote their two families the other way round.
 */
export function drawConsequenceHand(input: ConsequenceDrawInput): readonly ConsequenceFamily[] {
  const weights: Partial<Record<ConsequenceFamily, number>> = {};
  for (const family of CONSEQUENCE_FAMILIES) {
    if (family === 'formative' && input.rarityTier < CONSEQUENCE_FORMATIVE_MIN_TIER) continue;
    weights[family] = CONSEQUENCE_FAMILY_WEIGHTS[family][input.reach];
  }

  const drawn = drawFromTable(
    CONSEQUENCE_TABLE_ID,
    weights,
    input.templateId,
    consequenceHandSize(input.rarityTier),
  );

  return CONSEQUENCE_FAMILIES.filter(family => drawn.includes(family));
}

/** The hand a live template draws, read off its own declared reach and tier. */
export function drawnHandForTemplate(
  template: UnifiedActionTemplate,
): readonly ConsequenceFamily[] {
  return drawConsequenceHand({
    templateId: template.id,
    reach: template.reach,
    rarityTier: template.rarityTier,
  });
}

/**
 * The hand the template is actually held to, after its one recorded swap.
 *
 * Returns the drawn hand unchanged when there is no swap, so a caller never has
 * to branch on presence.
 */
export function handAfterSwap(
  drawn: readonly ConsequenceFamily[],
  swap: UnifiedActionTemplate['consequenceSwap'],
): readonly ConsequenceFamily[] {
  if (!swap) return drawn;
  const swapped = drawn.filter(family => family !== swap.from);
  if (swapped.length === drawn.length) return drawn; // `from` was not in the hand — the gate reports it
  return CONSEQUENCE_FAMILIES.filter(
    family => swapped.includes(family) || family === swap.to,
  );
}

// ─── Which families a template actually wires ────────────────────────

/**
 * The families an effect list satisfies.
 *
 * Takes the already-walked effects rather than the template, so the contract
 * keeps one walk of the aftermath (its `allAftermathEffects`) and this module
 * does not grow a second one that drifts from it.
 *
 * `hasRewardPool` is the other authoring route for `possession`: a `rewardPool`
 * recipe on a step outcome predates the `reward_draw` effect kind and grants the
 * same thing, so a gate that ignored it would tell an author to wire a
 * possession they had already wired.
 */
export function familiesWiredByEffects(
  effects: readonly EncounterAftermathReactionEffect[],
  hasRewardPool: boolean,
): ReadonlySet<ConsequenceFamily> {
  const wired = new Set<ConsequenceFamily>();

  for (const effect of effects) {
    // Read through an index signature rather than by narrowing the union: only
    // three of its ~40 members carry `targetLocationId`, and a `in`-narrow here
    // would have to be re-derived every time a member is added (THR-1143 added
    // the field to three of them at once).
    const locationTarget = (effect as unknown as Record<string, unknown>).targetLocationId;
    const onAPlace =
      LOCATION_CARRYING_CONDITION_KINDS.has(effect.kind)
      && typeof locationTarget === 'string'
      && locationTarget !== '';

    for (const family of CONSEQUENCE_FAMILIES) {
      if (!CONSEQUENCE_FAMILY_EFFECT_KINDS[family].includes(effect.kind)) continue;
      // A condition on a place is a `place` consequence, not a `condition` one,
      // and vice versa. Every other kind belongs to its families unconditionally.
      if (LOCATION_CARRYING_CONDITION_KINDS.has(effect.kind)) {
        if (family === 'place' && !onAPlace) continue;
        if (family === 'condition' && onAPlace) continue;
      }
      wired.add(family);
    }
  }

  if (hasRewardPool) wired.add('possession');
  return wired;
}

// ─── The gate ────────────────────────────────────────────────────────

/**
 * Check a template's recorded draw against the one its id computes.
 *
 * **Presence-conditional, deliberately.** A template with no `consequenceDraw`
 * returns no violations. The corpus predates the draw entirely, and requiring
 * the field outright would fail every template that is *not* on the
 * `RETROFIT_PENDING` ratchet — which is to say the six the Encounter Factory has
 * already retrofitted, and only those. Redding the finished work to enforce a
 * rule on the unfinished work is backwards, and it is the specific harm THR-1130's
 * mutex named. New factory output carries the field because the pipeline's brief
 * stage hands the author their hand and the spec requires it; the machine rule
 * here is what makes a *recorded* hand honest.
 *
 * Returns human-readable violations, never throws (NFP #4).
 */
export function checkConsequenceDraw(
  template: UnifiedActionTemplate,
  wired: ReadonlySet<ConsequenceFamily>,
): readonly string[] {
  const recorded = template.consequenceDraw;
  if (recorded === undefined) return [];

  const problems: string[] = [];
  const drawn = drawnHandForTemplate(template);
  const swap = template.consequenceSwap;

  // ── The swap, first: it decides what the recorded hand is compared against.
  if (swap) {
    const drawnNames: readonly string[] = drawn;
    if (!drawnNames.includes(swap.from)) {
      problems.push(
        `consequenceSwap trades away '${swap.from}', which this template never drew `
          + `(drawn: ${drawn.join(', ')})`,
      );
    }
    if (drawnNames.includes(swap.to)) {
      problems.push(
        `consequenceSwap trades in '${swap.to}', which is already in the drawn hand — `
          + 'that shrinks the hand rather than varying it',
      );
    }
    if (!isConsequenceFamily(swap.to)) {
      problems.push(`consequenceSwap names unknown family '${swap.to}'`);
    } else {
      const weight = CONSEQUENCE_FAMILY_WEIGHTS[swap.to][template.reach];
      if (weight < CONSEQUENCE_SWAP_MIN_WEIGHT) {
        problems.push(
          `consequenceSwap trades in '${swap.to}', weight ${weight} in ${template.reach} — `
            + `under the floor of ${CONSEQUENCE_SWAP_MIN_WEIGHT}`,
        );
      }
    }
    if (!swap.reason?.trim()) {
      problems.push('consequenceSwap declares no `reason` — an unexplained swap is an unrecorded one');
    }
  }

  // ── The recorded hand must be exactly the computed one, post-swap.
  const expected = handAfterSwap(drawn, swap);
  const recordedSet = [...new Set(recorded)].sort();
  const expectedSet = [...expected].sort();
  if (recordedSet.join('|') !== expectedSet.join('|')) {
    problems.push(
      `consequenceDraw records [${recorded.join(', ') || 'nothing'}] but this template's id `
        + `draws [${expected.join(', ')}]${swap ? ' (after the recorded swap)' : ''} — `
        + 'the hand is recomputed from the id, so it cannot be edited by hand; '
        + 'take the one recorded swap instead',
    );
    return problems;
  }

  // ── Every family in the hand must actually be wired.
  for (const family of expected) {
    if (wired.has(family)) continue;
    problems.push(
      `drew '${family}' but nothing wires it — author one of `
        + `[${CONSEQUENCE_FAMILY_EFFECT_KINDS[family].join(', ')}]`
        + `${family === 'place' ? ' with a location target' : ''}`
        + ', or record a `consequenceSwap` saying why the family fights the fiction',
    );
  }

  return problems;
}
