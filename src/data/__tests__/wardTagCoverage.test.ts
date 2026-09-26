/**
 * Every ward, cure and loss-guard names a tag some condition actually carries (THR-1569).
 *
 * Wards (`tag_immunity`), cures (`condition_remove` by tags) and condition loss-guards
 * (`prevent_loss` with `channel: 'condition'`) find their condition by tag. A tag no
 * condition carries is a ward that runs its check and blocks nothing — the trace shows the
 * immunity evaluated, so it reads as wired. THR-1569 found three of them at the heart of the
 * game: every fear ward missed Terrified, every wound cure missed Wounded, and every curse
 * ward missed Cursed, because the three conditions did not carry their family tags.
 *
 * The corpus is every entry of every registered content kind, walked deep, so an effect
 * nested in an `action_trigger` payload or an aftermath reaction is found wherever it sits.
 * A tag counts as covered only when a condition a *bearer* can hold carries it: place
 * conditions (`#location`) sit on the ground, never on the mortal the ward protects.
 */
import { describe, it, expect } from 'vitest';

import { CONTENT_OBJECT_KINDS } from '../content-objects';
import { authoredTags, entriesOfKind } from '../contentCatalogs';
import { normalizeTag } from '../../engine/effects/effectQueries';

/**
 * Tags a ward names that no bearer condition carries, each with the reason it is allowed to
 * stay that way. An entry here is a known gap with a stated reason, never a silent one; the
 * stale-entry test below fails when a listed tag becomes covered, so the list only shrinks.
 */
const UNCOVERED_WARD_TAGS_ALLOWLIST: Readonly<Record<string, string>> = {
  // Every tag below is also unseated in the closed vocabulary (`content-tags.ts`), and the
  // vocabulary ratchet forbids a condition authoring an unseated tag. Covering one therefore
  // means seating it (a UL/vocabulary decision) or retargeting the ward — content design,
  // not a tag fix. Measured 2026-09-26, THR-1569.
  '#intimidation': 'Unseated. Nearest bearer conditions are Terrified (#fear, which these same wards also name) and Shaken (#social); no condition is intimidation.',
  '#bruise': 'Unseated. The bruise conditions (Bruised Knuckles, Bruised Ribs) carry #wound; the maul and jerkin would need retargeting to #wound, which widens them to every injury.',
  '#tracked': 'Unseated. No tracking condition exists; Watch Scrutiny (#checkpoint #eye) is the nearest.',
  '#marked': 'Unseated. No marking condition exists; the reveal-family bearer marks are traits, not conditions.',
  '#corruption': 'Unseated. No corruption condition exists.',
  '#blight': 'Unseated. The only blight is the place condition Blighted Harvest, which no bearer holds.',
  '#poison': 'Unseated. No poison condition exists; the sicknesses carry #disease.',
  '#illusion': 'Unseated. No illusion condition exists.',
  '#cold': 'Unseated. No cold or exposure condition exists.',
  '#frostbite': 'Unseated. No frostbite condition exists.',
  '#dissonance': 'Unseated. No dissonance condition exists; the anomaly conditions carry #anomaly.',
};

/** The three shapes that find a condition by tag. */
type WardShape = 'tag_immunity' | 'condition_remove' | 'prevent_loss';

interface WardRef {
  readonly entryId: string;
  readonly shape: WardShape;
  readonly tags: readonly string[];
}

function wardShapeOf(node: Record<string, unknown>): WardShape | null {
  if (node.type === 'tag_immunity') return 'tag_immunity';
  if (node.type === 'prevent_loss' && node.channel === 'condition') return 'prevent_loss';
  if (node.kind === 'condition_remove' || node.type === 'condition_remove') return 'condition_remove';
  return null;
}

/** Walk one entry deep and collect every ward-shaped node that names tags. */
function collectWards(entryId: string, value: unknown, out: WardRef[], seen: Set<unknown>): void {
  if (value === null || typeof value !== 'object' || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) {
    for (const v of value) collectWards(entryId, v, out, seen);
    return;
  }
  const node = value as Record<string, unknown>;
  const shape = wardShapeOf(node);
  if (shape && Array.isArray(node.tags) && node.tags.length > 0) {
    out.push({ entryId, shape, tags: node.tags.filter((t): t is string => typeof t === 'string') });
  }
  for (const v of Object.values(node)) collectWards(entryId, v, out, seen);
}

const WARDS: readonly WardRef[] = (() => {
  const out: WardRef[] = [];
  const seen = new Set<unknown>();
  for (const kind of CONTENT_OBJECT_KINDS) {
    for (const entry of entriesOfKind(kind.id)) collectWards(entry.id, entry, out, seen);
  }
  return out;
})();

/** Normalized tags carried by at least one condition a bearer can hold. */
const BEARER_CONDITION_TAGS: ReadonlySet<string> = (() => {
  const tags = new Set<string>();
  for (const entry of entriesOfKind('condition_template')) {
    const own = authoredTags(entry).map(normalizeTag);
    if (own.includes('location')) continue;
    for (const t of own) tags.add(t);
  }
  return tags;
})();

/** Every uncovered tag, with the wards that name it. */
function uncoveredWardTags(): Map<string, string[]> {
  const misses = new Map<string, string[]>();
  for (const ward of WARDS) {
    for (const raw of ward.tags) {
      const tag = normalizeTag(raw);
      if (BEARER_CONDITION_TAGS.has(tag)) continue;
      const list = misses.get(tag) ?? [];
      list.push(`${ward.entryId} (${ward.shape})`);
      misses.set(tag, list);
    }
  }
  return misses;
}

describe('ward tag coverage (THR-1569)', () => {
  it('the corpus walk finds the wards it is meant to police', () => {
    // A walk that finds nothing passes every coverage check vacuously.
    const shapes = new Set(WARDS.map(w => w.shape));
    expect(shapes.has('tag_immunity')).toBe(true);
    expect(shapes.has('condition_remove')).toBe(true);
    expect(WARDS.length).toBeGreaterThan(10);
    expect(BEARER_CONDITION_TAGS.has('condition')).toBe(true);
  });

  it('every tag a ward, cure or loss-guard names is carried by a bearer condition', () => {
    const misses = [...uncoveredWardTags().entries()]
      .filter(([tag]) => !(`#${tag}` in UNCOVERED_WARD_TAGS_ALLOWLIST))
      .map(([tag, by]) => `#${tag} ← ${[...new Set(by)].join(', ')}`);
    expect(misses, `ward tags no bearer condition carries:\n${misses.join('\n')}`).toEqual([]);
  });

  it('the allowlist holds no stale entries', () => {
    const uncovered = uncoveredWardTags();
    const stale = Object.keys(UNCOVERED_WARD_TAGS_ALLOWLIST).filter(t => !uncovered.has(normalizeTag(t)));
    expect(stale, `allowlisted tags now covered — delete them: ${stale.join(', ')}`).toEqual([]);
  });

  it('the three central conditions carry their family tags', () => {
    const byId = new Map(entriesOfKind('condition_template').map(e => [e.id, authoredTags(e)]));
    expect(byId.get('trait.condition.terrified')).toContain('#fear');
    expect(byId.get('trait.condition.wounded')).toContain('#wound');
    expect(byId.get('trait.condition.cursed')).toContain('#curse');
  });
});
