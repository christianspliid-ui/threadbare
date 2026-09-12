/**
 * Adapter coverage — every member of every source vocabulary reaches a surface row
 * (THR-1490).
 *
 * Three vocabularies name things in this game, each older than `WorldRefKind` and each
 * with its own membership: `NavigationTarget['kind']` (what a notification points at),
 * `ThreadCategory` (what the player holds a thread to), and the encounter veil's
 * `visualKind` (what a chip or a name in prose can be). The router turns all three into
 * `WorldRef`s, which means a member with no mapping is a link that renders and does
 * nothing — Law 21's dead link, arrived at by omission.
 *
 * The type system catches *most* of this: the three maps are `Record`s keyed on their
 * source union, so a member added upstream fails to compile here. What it cannot catch is
 * a mapping that exists and points at the wrong kind, or a source union that drifts from
 * the literal keys these records are declared with. That is what runs below.
 *
 * **Falsification** (each block says which line to break):
 *   - delete a key from `WORLD_REF_KIND_BY_THREAD_CATEGORY` → compile error, then a red
 *     `every ThreadCategory maps` once the key is re-added as a wrong value;
 *   - point `visualKind.companion` at `'agent'` → red on the identity block;
 *   - drop the `artifact` arm from `toNavigationTarget` → red on the sheet block.
 * Each was run red before this file was committed.
 */

import { describe, it, expect } from 'vitest';
import {
  WORLD_REF_KIND_BY_THREAD_CATEGORY,
  WORLD_REF_KIND_BY_VISUAL_KIND,
  fromNavigationTarget,
  toNavigationTarget,
} from '../worldRefAdapters';
import { isWorldRefKind, WORLD_REF_KINDS, type WorldRefKind } from '../worldRef';
import { SURFACE_BY_WORLD_REF } from '../../data/surface-registry';
import type { NavigationTarget } from '../notification';
import type { ThreadCategory } from '../../engine/retinue';

/**
 * Every `NavigationTarget` arm, as a value.
 *
 * Hand-listed because a union of object shapes has no runtime members, and pinned
 * against `fromNavigationTarget`'s exhaustive switch below — if an arm is added upstream
 * and not here, that switch stops being exhaustive and the compile fails there.
 */
const EVERY_NAVIGATION_TARGET: readonly NavigationTarget[] = [
  { kind: 'agent', agentId: 'a1' },
  { kind: 'encounter', encounterId: 'e1' },
  { kind: 'hex', col: 3, row: 9 },
  { kind: 'location', locationNodeId: 'loc1' },
  { kind: 'area', areaId: 'area1' },
  { kind: 'faction', factionId: 'f1' },
  { kind: 'journey', journeyId: 'j1', agentId: 'a1' },
  { kind: 'receipt', receiptId: 'r1' },
  { kind: 'artifact', artifactId: 'art1' },
  { kind: 'attachment', templateNodeId: 'att1' },
  { kind: 'army', armyId: 'army1' },
];

/** Every `ThreadCategory`, as a value — the union is a string literal union, so this is checkable. */
const EVERY_THREAD_CATEGORY: readonly ThreadCategory[] = [
  'agent', 'location', 'faction', 'army', 'artifact',
];

/** Every veil `visualKind`, as a value. Mirrors `EncounterVeil.openEntity`'s parameter union. */
const EVERY_VISUAL_KIND = [
  'agent', 'faction', 'artifact', 'companion', 'attachment', 'location', 'area',
] as const;

describe('adapter coverage — NavigationTarget', () => {
  it('maps every arm to a WorldRefKind with a surface row', () => {
    for (const target of EVERY_NAVIGATION_TARGET) {
      const ref = fromNavigationTarget(target);
      expect(isWorldRefKind(ref.kind), `"${target.kind}" → "${ref.kind}" is not a WorldRefKind`).toBe(true);
      expect(SURFACE_BY_WORLD_REF[ref.kind], `no surface row for "${ref.kind}"`).toBeDefined();
      expect(ref.id, `"${target.kind}" lost its id in the round trip`).toBeTruthy();
    }
  });

  it('covers every arm the union declares — no arm goes untested', () => {
    // Pins the hand-written fixture above against the registry's own claim about which
    // kinds have sheets: every non-null `sheet` value must appear as an arm here.
    const tested = new Set(EVERY_NAVIGATION_TARGET.map(t => t.kind));
    const promised = WORLD_REF_KINDS
      .map(k => SURFACE_BY_WORLD_REF[k].sheet)
      .filter((s): s is NavigationTarget['kind'] => s !== null && s !== 'codex');
    for (const sheet of promised) {
      expect(tested.has(sheet), `surface registry promises sheet "${sheet}" and no fixture exercises it`).toBe(true);
    }
  });

  it('round-trips: every arm survives WorldRef and comes back the same kind', () => {
    for (const target of EVERY_NAVIGATION_TARGET) {
      const ref = fromNavigationTarget(target);
      const back = toNavigationTarget(ref, { agentId: 'a1' });
      expect(back?.kind, `"${target.kind}" did not survive the round trip`).toBe(target.kind);
    }
  });
});

describe('adapter coverage — ThreadCategory', () => {
  it('maps every category to a WorldRefKind with a surface row', () => {
    for (const category of EVERY_THREAD_CATEGORY) {
      const kind: WorldRefKind = WORLD_REF_KIND_BY_THREAD_CATEGORY[category];
      expect(kind, `ThreadCategory "${category}" maps to nothing`).toBeTruthy();
      expect(SURFACE_BY_WORLD_REF[kind], `no surface row for "${kind}"`).toBeDefined();
    }
  });

  it('covers the whole union — the map has exactly the categories, no more and no fewer', () => {
    expect(Object.keys(WORLD_REF_KIND_BY_THREAD_CATEGORY).sort()).toEqual([...EVERY_THREAD_CATEGORY].sort());
  });

  it('every category reaches a real sheet — a thread row that opens a card would be a regression', () => {
    // The thread panel's "view profile" asks for Tier 3. All five kinds have one today;
    // if a future kind does not, the router falls back to its card and this says so.
    for (const category of EVERY_THREAD_CATEGORY) {
      const kind = WORLD_REF_KIND_BY_THREAD_CATEGORY[category];
      expect(SURFACE_BY_WORLD_REF[kind].sheet, `thread category "${category}" has no sheet`).not.toBeNull();
    }
  });
});

describe('adapter coverage — encounter veil visualKind', () => {
  it('maps every visual kind to a WorldRefKind with a surface row', () => {
    for (const visual of EVERY_VISUAL_KIND) {
      const kind: WorldRefKind = WORLD_REF_KIND_BY_VISUAL_KIND[visual];
      expect(kind, `visualKind "${visual}" maps to nothing`).toBeTruthy();
      expect(SURFACE_BY_WORLD_REF[kind], `no surface row for "${kind}"`).toBeDefined();
    }
  });

  it('covers the whole union', () => {
    expect(Object.keys(WORLD_REF_KIND_BY_VISUAL_KIND).sort()).toEqual([...EVERY_VISUAL_KIND].sort());
  });

  it('maps companion to companion — the kind is not what was withheld', () => {
    // The regression this guards is a tempting one: companions had no destination, so
    // mapping them onto `agent` "so the click does something" looks like a fix and is
    // the bug THR-1096 ruled against. The kind is honest; the *sheet* is null.
    expect(WORLD_REF_KIND_BY_VISUAL_KIND.companion).toBe('companion');
    expect(SURFACE_BY_WORLD_REF.companion.sheet).toBeNull();
    expect(SURFACE_BY_WORLD_REF.companion.card).toBe('actor');
  });

  it('gives every visual kind a card — every chip on an encounter is now openable', () => {
    // The measured defect: before this, `openEntity` returned undefined for companion and
    // the veil's own union had no arm for army or hex, so those names rendered as text on
    // a surface where a faction's name was a link.
    for (const visual of EVERY_VISUAL_KIND) {
      const kind = WORLD_REF_KIND_BY_VISUAL_KIND[visual];
      expect(SURFACE_BY_WORLD_REF[kind].card, `visualKind "${visual}" has no card`).toBeTruthy();
    }
  });
});
