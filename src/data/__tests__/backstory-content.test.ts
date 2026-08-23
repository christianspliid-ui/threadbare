/**
 * Tests for the Backstory Content package.
 * Validates structure, key coverage, placeholder consistency,
 * and minimum template density for all 12 content tables.
 *
 * Design doc: Docs/plans/2026-03-17-tiered-backstory-generation-design.md
 */

import { describe, test, expect } from 'vitest';
import {
  SURFACE_ORIGIN_PROSE,
  SURFACE_SPHERE_PROSE,
  BOND_HISTORY_PROSE,
  BOND_HISTORY_NEGATIVE_PROSE,
  TRAIT_ORIGIN_PROSE,
  TURNING_POINT_PROSE,
  CONTRADICTION_PROSE,
  DECISIVE_NATURE_PROSE,
  FEAR_PROSE,
  HIDDEN_MOTIVE_PROSE,
  STORY_ARC_PROSE,
  DIVINE_TRANSFORMATION_PROSE,
} from '../backstory-content';

// ─── Shared Constants ───────────────────────────────────────────────────────

const ALL_ARCHETYPES = [
  'tragic_hero', 'trickster', 'coming_of_age', 'brooding_warrior',
  'fallen_noble', 'true_believer', 'schemer', 'wanderer', 'monster',
  'folk_hero', 'reluctant_king', 'oathkeeper', 'poisoned_court',
  'doomed_innocent', 'old_power', 'kingmaker', 'seeker', 'maker',
  'noble_savage',
];

const ALL_SPHERES = ['force', 'matter', 'energy', 'life', 'mind', 'spirit', 'time', 'entropy'];

const ALL_BOND_BASES = ['friendship', 'rivalry', 'loyalty', 'alliance', 'trade', 'faith', 'lineage', 'gratitude'];

const ALL_TRAIT_CATEGORIES = ['innate', 'mastery', 'reputation', 'scar', 'condition', 'destiny'];

const ALL_VALUE_PAIRS = [
  'mercy_ruthlessness', 'asceticism_extravagance', 'honesty_cunning',
  'tradition_novelty', 'loyalty_ambition', 'revelation_discretion',
  'preservation_transformation', 'sacrifice_survival', 'courage_prudence',
];

const ALL_FEAR_KEYS = ALL_VALUE_PAIRS.flatMap((pair) => [`${pair}_positive`, `${pair}_negative`]);

const ALL_STRATEGIES = ['tit-for-tat', 'grudger', 'pavlov', 'always-cooperate', 'always-defect'];

const ALL_BRACKETS = ['low', 'medium', 'high', 'massive'];

/**
 * Minimum variants every keyed-table key must carry, and the floor for the one
 * flat table. Both are pinned to the shipped counts (THR-625) rather than to a
 * permissive baseline — see the note on the density test in `validateKeyedTable`.
 */
const MIN_VARIANTS_PER_KEY = 6;
const MIN_DECISIVE_NATURE_VARIANTS = 8;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Validate a keyed content table.
 * `requiredPlaceholders` uses "at least one template per key" semantics —
 * not every template must contain the placeholder, but each key must have
 * at least one template that does.
 */
function validateKeyedTable(
  table: Record<string, string[]>,
  requiredKeys: string[],
  requiredPlaceholders: string[],
  tableName: string,
) {
  test(`${tableName}: has all required keys`, () => {
    requiredKeys.forEach((key) => {
      expect(table[key]).toBeDefined();
    });
  });

  // Density floor is pinned to what the tables actually ship (THR-625: every key
  // carries >= 6 variants). A floor below the shipped count cannot fail on a
  // depth change, which makes a green run meaningless as evidence for one.
  test(`${tableName}: each key has at least ${MIN_VARIANTS_PER_KEY} templates`, () => {
    requiredKeys.forEach((key) => {
      expect(table[key].length).toBeGreaterThanOrEqual(MIN_VARIANTS_PER_KEY);
    });
  });

  test(`${tableName}: each template is substantive (>20 chars)`, () => {
    requiredKeys.forEach((key) => {
      table[key].forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  if (requiredPlaceholders.length > 0) {
    test(`${tableName}: each key has at least one template per required placeholder`, () => {
      requiredKeys.forEach((key) => {
        requiredPlaceholders.forEach((placeholder) => {
          const hasPlaceholder = table[key].some((t) => t.includes(placeholder));
          expect(hasPlaceholder).toBe(true);
        });
      });
    });
  }
}

// ─── Table 1: SURFACE_ORIGIN_PROSE ──────────────────────────────────────────

describe('SURFACE_ORIGIN_PROSE', () => {
  validateKeyedTable(SURFACE_ORIGIN_PROSE, ALL_ARCHETYPES, ['{name}'], 'SURFACE_ORIGIN_PROSE');

  test('each key has at least one template using {culture} and {archetype}', () => {
    ALL_ARCHETYPES.forEach((archetype) => {
      const hasCulture = SURFACE_ORIGIN_PROSE[archetype].some((t) => t.includes('{culture}'));
      const hasArchetype = SURFACE_ORIGIN_PROSE[archetype].some((t) => t.includes('{archetype}'));
      expect(hasCulture).toBe(true);
      expect(hasArchetype).toBe(true);
    });
  });

  test('covers all 19 narrative archetypes (no extras with typos)', () => {
    expect(Object.keys(SURFACE_ORIGIN_PROSE).length).toBe(ALL_ARCHETYPES.length);
  });
});

// ─── Table 2: SURFACE_SPHERE_PROSE ──────────────────────────────────────────

describe('SURFACE_SPHERE_PROSE', () => {
  validateKeyedTable(SURFACE_SPHERE_PROSE, ALL_SPHERES, ['{name}', '{sphere}'], 'SURFACE_SPHERE_PROSE');

  test('covers all 8 creation spheres (no missing)', () => {
    expect(Object.keys(SURFACE_SPHERE_PROSE).length).toBe(ALL_SPHERES.length);
  });
});

// ─── Table 3: BOND_HISTORY_PROSE ────────────────────────────────────────────

describe('BOND_HISTORY_PROSE', () => {
  validateKeyedTable(BOND_HISTORY_PROSE, ALL_BOND_BASES, ['{name}', '{bond}'], 'BOND_HISTORY_PROSE');

  test('covers all 8 bond basis types', () => {
    expect(Object.keys(BOND_HISTORY_PROSE).length).toBe(ALL_BOND_BASES.length);
  });

  test('each key has at least one template using {basis}', () => {
    ALL_BOND_BASES.forEach((basis) => {
      const hasBasisRef = BOND_HISTORY_PROSE[basis].some((t) => t.includes('{basis}'));
      expect(hasBasisRef).toBe(true);
    });
  });
});

// ─── Table 4: BOND_HISTORY_NEGATIVE_PROSE ───────────────────────────────────

describe('BOND_HISTORY_NEGATIVE_PROSE', () => {
  validateKeyedTable(BOND_HISTORY_NEGATIVE_PROSE, ALL_BOND_BASES, ['{name}', '{bond}'], 'BOND_HISTORY_NEGATIVE_PROSE');

  test('covers all 8 bond basis types', () => {
    expect(Object.keys(BOND_HISTORY_NEGATIVE_PROSE).length).toBe(ALL_BOND_BASES.length);
  });

  test('negative templates are distinct from positive templates', () => {
    ALL_BOND_BASES.forEach((basis) => {
      const positiveSet = new Set(BOND_HISTORY_PROSE[basis]);
      BOND_HISTORY_NEGATIVE_PROSE[basis].forEach((template) => {
        expect(positiveSet.has(template)).toBe(false);
      });
    });
  });
});

// ─── Table 5: TRAIT_ORIGIN_PROSE ────────────────────────────────────────────

describe('TRAIT_ORIGIN_PROSE', () => {
  validateKeyedTable(TRAIT_ORIGIN_PROSE, ALL_TRAIT_CATEGORIES, ['{name}', '{trait}'], 'TRAIT_ORIGIN_PROSE');

  test(`each trait category has at least ${MIN_VARIANTS_PER_KEY} templates`, () => {
    ALL_TRAIT_CATEGORIES.forEach((category) => {
      expect(TRAIT_ORIGIN_PROSE[category].length).toBeGreaterThanOrEqual(MIN_VARIANTS_PER_KEY);
    });
  });

  test('covers all 6 trait categories', () => {
    expect(Object.keys(TRAIT_ORIGIN_PROSE).length).toBe(ALL_TRAIT_CATEGORIES.length);
  });
});

// ─── Table 6: TURNING_POINT_PROSE ───────────────────────────────────────────

describe('TURNING_POINT_PROSE', () => {
  validateKeyedTable(TURNING_POINT_PROSE, ALL_VALUE_PAIRS, ['{name}', '{value}'], 'TURNING_POINT_PROSE');

  test(`each value pair has at least ${MIN_VARIANTS_PER_KEY} templates`, () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      expect(TURNING_POINT_PROSE[pair].length).toBeGreaterThanOrEqual(MIN_VARIANTS_PER_KEY);
    });
  });

  test('covers all 9 value pairs', () => {
    expect(Object.keys(TURNING_POINT_PROSE).length).toBe(ALL_VALUE_PAIRS.length);
  });
});

// ─── Table 7: CONTRADICTION_PROSE ───────────────────────────────────────────

describe('CONTRADICTION_PROSE', () => {
  validateKeyedTable(
    CONTRADICTION_PROSE, ALL_VALUE_PAIRS,
    ['{name}', '{left_pole}', '{right_pole}'],
    'CONTRADICTION_PROSE',
  );

  test('covers all 9 value pairs', () => {
    expect(Object.keys(CONTRADICTION_PROSE).length).toBe(ALL_VALUE_PAIRS.length);
  });
});

// ─── Table 8: DECISIVE_NATURE_PROSE ─────────────────────────────────────────

describe('DECISIVE_NATURE_PROSE', () => {
  test(`is a flat array with at least ${MIN_DECISIVE_NATURE_VARIANTS} entries`, () => {
    expect(Array.isArray(DECISIVE_NATURE_PROSE)).toBe(true);
    expect(DECISIVE_NATURE_PROSE.length).toBeGreaterThanOrEqual(MIN_DECISIVE_NATURE_VARIANTS);
  });

  test('each entry is substantive (>20 chars)', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry.length).toBeGreaterThan(20);
    });
  });

  test('all entries use {name} placeholder', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry).toContain('{name}');
    });
  });

  test('entries do not use {left_pole} or {right_pole} (those are for CONTRADICTION_PROSE)', () => {
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      expect(entry).not.toContain('{left_pole}');
      expect(entry).not.toContain('{right_pole}');
    });
  });
});

// ─── Table 9: FEAR_PROSE ─────────────────────────────────────────────────────

describe('FEAR_PROSE', () => {
  test(`has all ${ALL_FEAR_KEYS.length} expected keys`, () => {
    ALL_FEAR_KEYS.forEach((key) => {
      expect(FEAR_PROSE[key]).toBeDefined();
    });
  });

  test(`each key has at least ${MIN_VARIANTS_PER_KEY} templates`, () => {
    ALL_FEAR_KEYS.forEach((key) => {
      expect(FEAR_PROSE[key].length).toBeGreaterThanOrEqual(MIN_VARIANTS_PER_KEY);
    });
  });

  test('each template is substantive (>20 chars)', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      FEAR_PROSE[key].forEach((template) => {
        expect(template.length).toBeGreaterThan(20);
      });
    });
  });

  test('each key has at least one template per required placeholder ({name}, {fear}, {value})', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      const hasName = FEAR_PROSE[key].some((t) => t.includes('{name}'));
      const hasFear = FEAR_PROSE[key].some((t) => t.includes('{fear}'));
      const hasValue = FEAR_PROSE[key].some((t) => t.includes('{value}'));
      expect(hasName).toBe(true);
      expect(hasFear).toBe(true);
      expect(hasValue).toBe(true);
    });
  });

  // THR-1187 — reviewed pole manifest.
  //
  // Why this exists: `honesty_cunning_positive` and `_negative` shipped with each other's
  // bodies, so the _positive key rendered {value} = "Honest" over four bodies about
  // practising deception. Every structural test above passed on that arrangement — key
  // coverage, density, placeholder presence and distinctness are all blind to which pole a
  // body belongs to. Nothing in the suite could see it.
  //
  // Each entry is one distinctive fragment from a body a human read and assigned to that
  // pole. A swap between two keys lands both fragments on the wrong key and fails both
  // directions of the check below. The manifest is asserted to cover ALL_FEAR_KEYS, so a
  // new value pair cannot be added without someone reading its bodies and choosing a
  // fragment — which is the review this table exists to force.
  //
  // THR-1203 widened the manifest from one entry per KEY to one entry per BODY.
  //
  // The bound it closes, measured under THR-1202: each key holds six bodies and the old
  // manifest pinned one, so an off-axis body in any of the other five slots was invisible.
  // Swapping body 2 of preservation_transformation_positive back to its pre-fix
  // control/authority text left the suite 272/272 green; the same swap on the pinned body
  // went red on exactly that key. THR-1202's own defect sat in bodies 1-4 — had it landed
  // only in bodies 2-3 this manifest would have stayed green through it.
  //
  // All 108 bodies were read against the pole authority (FEAR_DESCRIPTIONS in
  // src/data/strand-content.ts: each pole fears the undoing of what that pole is committed
  // to) and assigned individually. The fragments are NOT generated from the table — a
  // generated set would launder unaudited content as audited, and the reading is the whole
  // product here.
  //
  // `witness` is the honest part, and it is on every line because a partial manifest that
  // does not say so reads as full coverage:
  //
  //   'pole' — the fragment names something only this pole's fear could produce. Move the
  //     body to the sibling key and a reader would see it is wrong. A red here is a real
  //     aboutness failure.
  //   'edit' — the body is pole-agnostic: it reads equally well under either noun, so no
  //     fragment drawn from it can witness a swap. The entry still pins the text against a
  //     silent rewrite, and the sibling-absence check still passes non-vacuously, but a
  //     GREEN here says nothing about which pole the body belongs on. Ten bodies are in
  //     this class; the count is pinned below so it cannot grow unnoticed.
  type ReviewedBody = { fragment: string; witness: 'pole' | 'edit' };

  const POLE_MANIFEST: Record<string, ReviewedBody[]> = {
    // courage / fears showing weakness
    courage_prudence_positive: [
      { fragment: 'the strength they project would be revealed as calculation in disguise', witness: 'pole' },
      { fragment: 'reveal itself as performed rather than real', witness: 'pole' },
      { fragment: 'not cowardice, but something more specific', witness: 'pole' },
      { fragment: 'volunteers first for every danger', witness: 'pole' },
      { fragment: 'takes the front position without being asked', witness: 'pole' },
      { fragment: 'someone whose version of it costs nothing', witness: 'pole' },
    ],
    // prudence / fears reckless consequences
    courage_prudence_negative: [
      { fragment: 'without careful calculation, something catastrophic would result', witness: 'pole' },
      { fragment: 'when calculation fails and impulse takes over', witness: 'pole' },
      { fragment: 'the instinct turns out to have been wrong about what it understood', witness: 'pole' },
      { fragment: 'the lists, the contingencies, the plans within plans', witness: 'pole' },
      { fragment: 'has never once been caught unprepared', witness: 'pole' },
      { fragment: 'what they would do without time to think', witness: 'pole' },
    ],
    // honesty / fears having to deceive. Bodies 5-6 of both keys were authored pole-agnostic
    // and stayed on the key they were written for through THR-1187 — they are the reason
    // this manifest needs a witness field rather than a longer fragment list.
    honesty_cunning_positive: [
      { fragment: 'circumstances will require deception and that they will be visibly bad at it', witness: 'pole' },
      { fragment: 'the simpler fear of the lie being seen', witness: 'pole' },
      { fragment: 'deception would have been, and that in that moment they will be unable to deploy it', witness: 'pole' },
      { fragment: 'watches the cunning prosper', witness: 'pole' },
      { fragment: 'has made them predictable', witness: 'edit' },
      { fragment: 'the accounting arrives at', witness: 'edit' },
    ],
    // cunning / fears being outwitted
    honesty_cunning_negative: [
      { fragment: 'found by someone better at the same game', witness: 'pole' },
      { fragment: 'the deception, if discovered, will define everything that came before it', witness: 'pole' },
      { fragment: 'cannot return to the alternative even when the alternative becomes necessary', witness: 'pole' },
      { fragment: 'keeps no journal, writes no letters', witness: 'pole' },
      { fragment: 'nothing has yet asked a high enough price', witness: 'edit' },
      { fragment: 'needs an audience to hold its shape', witness: 'edit' },
    ],
    // sacrifice / fears abandonment by their cause
    sacrifice_survival_positive: [
      { fragment: 'the thing they organized around was unworthy', witness: 'pole' },
      { fragment: 'require something they cannot give', witness: 'pole' },
      { fragment: 'dependency wearing a more respectable name', witness: 'pole' },
      { fragment: 'the way a gardener tends a plant in drought', witness: 'pole' },
      { fragment: 'the version with nobody watching', witness: 'edit' },
      { fragment: 'did not buy what it was supposed to buy', witness: 'pole' },
    ],
    // survival / fears losing freedom
    sacrifice_survival_negative: [
      { fragment: 'obligation so total it leaves no remainder of themselves', witness: 'pole' },
      { fragment: 'belonging has closed around them', witness: 'pole' },
      { fragment: 'the independence is elaborate avoidance', witness: 'pole' },
      { fragment: 'leaves before being asked to stay', witness: 'pole' },
      { fragment: 'has stayed alive through things that took other people', witness: 'pole' },
      // "makes a certain arithmetic easy" — the arithmetic of who to leave behind reads as
      // survival, the arithmetic of what to give up reads as sacrifice. Neither is excluded.
      { fragment: 'makes a certain arithmetic easy', witness: 'edit' },
    ],
    // loyalty / fears betrayal by those they trust
    loyalty_ambition_positive: [
      { fragment: 'betrayal by those they have trusted most', witness: 'pole' },
      { fragment: 'prove to have been bound to something else all along', witness: 'pole' },
      { fragment: 'had the giving made into a liability', witness: 'pole' },
      { fragment: 'small betrayals staged to see who notices', witness: 'pole' },
      { fragment: 'has been convenient so far', witness: 'edit' },
      { fragment: 'discovering the people it was for did not notice', witness: 'pole' },
    ],
    // ambition / fears irrelevance and failure
    loyalty_ambition_negative: [
      { fragment: 'loyalty as chain rather than bond', witness: 'pole' },
      { fragment: 'the cost of keeping faith exceeds any benefit', witness: 'pole' },
      { fragment: 'their defection, in the wrong circumstance', witness: 'pole' },
      { fragment: 'never kept a promise longer than it was useful', witness: 'pole' },
      { fragment: 'somebody else is keeping it', witness: 'edit' },
      { fragment: 'no amount will read as enough', witness: 'pole' },
    ],
    // tradition / fears the loss of the old ways
    tradition_novelty_positive: [
      { fragment: 'the old ways are irreplaceable', witness: 'pole' },
      { fragment: 'discarded by people who do not understand what it cost', witness: 'pole' },
      { fragment: 'accumulated investment is let go by people who did not pay the cost', witness: 'pole' },
      { fragment: 'tends rituals that no one else remembers', witness: 'pole' },
      { fragment: 'was inherited rather than chosen', witness: 'pole' },
      { fragment: 'the shape of the place they came from', witness: 'pole' },
    ],
    // innovation / fears stagnation
    tradition_novelty_negative: [
      { fragment: 'the past with different furniture', witness: 'pole' },
      { fragment: 'the world has moved and they have not', witness: 'pole' },
      { fragment: 'innovation runs out before it arrives somewhere stable', witness: 'pole' },
      { fragment: 'dismantles things that still work', witness: 'pole' },
      { fragment: 'an inability to stay long enough to be judged', witness: 'pole' },
      { fragment: 'has cost them continuity', witness: 'pole' },
    ],
    // preservation / fears all they have built crumbling to nothing.
    // THR-1202 rewrote bodies 1-4 of both keys off a control/authority axis ValuePair does
    // not carry; bodies 5-6 were already on-axis. All six of each are read fresh here.
    preservation_transformation_positive: [
      { fragment: 'already failing somewhere they cannot see', witness: 'pole' },
      { fragment: 'every year of care spends some of what is left', witness: 'pole' },
      { fragment: 'maintenance is not the opposite of collapse but its slower form', witness: 'pole' },
      { fragment: 'walks the same round every evening', witness: 'pole' },
      { fragment: 'already gone before they took the post', witness: 'pole' },
      { fragment: 'the last person who remembers why the thing mattered', witness: 'pole' },
    ],
    // transformation / fears being enslaved by what they cannot change
    preservation_transformation_negative: [
      { fragment: 'the one thing that will not be argued with', witness: 'pole' },
      { fragment: 'an arrangement they cannot alter', witness: 'pole' },
      { fragment: 'how little was ever up for a vote', witness: 'pole' },
      { fragment: 'keeps nothing that cannot be carried', witness: 'pole' },
      { fragment: 'an allergy to whatever refuses to change', witness: 'pole' },
      { fragment: 'the trail is the actual output', witness: 'pole' },
    ],
    // mercy / fears vulnerability from showing mercy (plus the Iron and Shadow reach fears
    // integrated into this pole: powerlessness, exposure)
    mercy_ruthlessness_positive: [
      { fragment: 'having reason for anger and finding that the anger accomplishes nothing', witness: 'pole' },
      { fragment: 'would not stop at the appropriate moment', witness: 'pole' },
      { fragment: 'the alternative is only grief', witness: 'pole' },
      { fragment: 'breaks things when alone', witness: 'pole' },
      { fragment: 'a way of not finding out what they are capable of', witness: 'pole' },
      { fragment: 'has never been cruel where anyone could witness it', witness: 'pole' },
    ],
    // ruthlessness / fears becoming heartless.
    // THR-1204 rewrote bodies 1-3, which carried the right fear for this pole while naming
    // the disposition "the patience" — the mercy pole's word — beside {value} =
    // "ruthlessness". All three fragments below are read off the replacement text. Body 2
    // was the witness:'edit' entry here: it read as a restrained agent's fear of their own
    // anger, near-synonymous with _positive body 2, and two bodies saying the same thing on
    // opposite poles cannot witness a swap. Rewritten onto its own pole (the fear is now of
    // anger's ABSENCE, which only this pole fears), so it flips to 'pole' and the
    // pole-agnostic count below drops 11 → 10.
    mercy_ruthlessness_negative: [
      { fragment: 'never once been stopped by what was in front of it', witness: 'pole' },
      { fragment: 'Anger would at least be feeling', witness: 'pole' },
      { fragment: 'Each hard call comes easier than the last', witness: 'pole' },
      { fragment: 'what the calm is sitting on', witness: 'pole' },
      { fragment: 'indistinguishable from appetite', witness: 'pole' },
      { fragment: 'began as a decision and has been running on its own', witness: 'pole' },
    ],
    // asceticism / fears poverty and scarcity
    asceticism_extravagance_positive: [
      { fragment: 'the hollow interior state that scarcity produces', witness: 'pole' },
      { fragment: 'the margin between sufficient and insufficient is thinner than it looks', witness: 'pole' },
      { fragment: 'hunger that does not know how to recognize satisfaction', witness: 'pole' },
      { fragment: 'coins, stores, alliances, debts owed', witness: 'pole' },
      { fragment: 'a way of owing nobody anything', witness: 'pole' },
      // "would not know how to stop" reads as easily on giving as on withholding.
      { fragment: 'smaller than it looks from outside', witness: 'edit' },
    ],
    // extravagance / fears becoming selfish
    asceticism_extravagance_negative: [
      { fragment: 'the generosity will eventually reach a limit', witness: 'pole' },
      { fragment: 'what will emerge is not what they have shown the world', witness: 'edit' },
      { fragment: 'the generosity is generous partly because they are afraid', witness: 'pole' },
      { fragment: 'gives until it hurts and then gives past the hurting', witness: 'pole' },
      { fragment: 'gives more than they can spare', witness: 'pole' },
      { fragment: 'is loud on purpose', witness: 'pole' },
    ],
    // candour / fears being kept blind by those they trust
    revelation_discretion_positive: [
      { fragment: 'the truth, spoken plainly, costs more than the silence it replaces', witness: 'pole' },
      { fragment: 'bluntness, in the wrong moment', witness: 'pole' },
      { fragment: 'the true thing said at the wrong moment', witness: 'pole' },
      { fragment: 'in the conversations everyone else is avoiding', witness: 'pole' },
      { fragment: 'the silence they would otherwise have to hold', witness: 'pole' },
      { fragment: 'has been mistaken for courage, when it has mostly been relief', witness: 'pole' },
    ],
    // discretion / fears the harm their knowledge might cause
    revelation_discretion_negative: [
      { fragment: 'the raw, unpolished self seen by someone who matters', witness: 'pole' },
      { fragment: 'The propriety is armour', witness: 'pole' },
      { fragment: 'control of the sequence', witness: 'pole' },
      { fragment: 'deflects every question that probes too close', witness: 'pole' },
      { fragment: 'the holding has become the point', witness: 'pole' },
      { fragment: 'left them alone in a way they did not plan for', witness: 'pole' },
    ],
  };

  test('every fear key carries a reviewed entry for every one of its bodies', () => {
    expect(Object.keys(POLE_MANIFEST).sort()).toEqual([...ALL_FEAR_KEYS].sort());

    ALL_FEAR_KEYS.forEach((key) => {
      expect(
        POLE_MANIFEST[key].length,
        `${key} has ${FEAR_PROSE[key].length} bodies but ${POLE_MANIFEST[key].length} reviewed entries — ` +
          'every body needs one, and the fragment must be read off the body rather than generated from it',
      ).toBe(FEAR_PROSE[key].length);
    });
  });

  // Without this, six fragments could all be read off the same body and the manifest would
  // report per-body coverage it does not have. Asserting a bijection rather than an index
  // match keeps it robust to reordering the bodies.
  test('the reviewed fragments of a key pin six different bodies, one each', () => {
    ALL_FEAR_KEYS.forEach((key) => {
      const matched = POLE_MANIFEST[key].map(({ fragment }) => {
        const hits = FEAR_PROSE[key]
          .map((body, i) => (body.includes(fragment) ? i : -1))
          .filter((i) => i >= 0);

        expect(
          hits.length,
          `${key}: fragment "${fragment}" matches ${hits.length} bodies — it must match exactly one`,
        ).toBe(1);

        return hits[0];
      });

      expect(
        new Set(matched).size,
        `${key}: the six fragments matched bodies [${matched.join(', ')}] — two of them read off the same body`,
      ).toBe(matched.length);
    });
  });

  test('each reviewed fragment is present on its own key and absent from the opposite pole', () => {
    for (const [key, entries] of Object.entries(POLE_MANIFEST)) {
      const sibling = key.endsWith('_positive')
        ? key.replace(/_positive$/, '_negative')
        : key.replace(/_negative$/, '_positive');

      for (const { fragment } of entries) {
        expect(
          FEAR_PROSE[key].some((t) => t.includes(fragment)),
          `${key} should contain its reviewed fragment "${fragment}"`,
        ).toBe(true);

        // The half that catches a swap. It also proves the fragment discriminates at all —
        // a fragment common to both poles would fail here rather than passing vacuously.
        // Note this is a TEXT check on all 108: for a witness:'edit' entry it holds without
        // saying anything about pole, which is what the witness field records.
        expect(
          FEAR_PROSE[sibling].some((t) => t.includes(fragment)),
          `${sibling} should NOT contain ${key}'s reviewed fragment "${fragment}"`,
        ).toBe(false);
      }
    }
  });

  // The gap, as a number someone has to look at. A body that cannot witness a pole swap is
  // a real hole in this manifest's coverage; pinning the count means the hole can only grow
  // by a deliberate edit here, never by a new pole-agnostic body slipping in unremarked.
  test('the number of bodies that cannot witness a pole swap is pinned', () => {
    const editOnly = Object.entries(POLE_MANIFEST).flatMap(([key, entries]) =>
      entries.filter((e) => e.witness === 'edit').map((e) => `${key}: "${e.fragment}"`),
    );

    expect(
      editOnly.length,
      `pole-agnostic bodies changed. Currently:\n  ${editOnly.join('\n  ')}\n` +
        'If a body was rewritten onto its own pole, lower this number and flip its witness to ' +
        "'pole'. If a new pole-agnostic body was added, raise it deliberately — do not flip a " +
        "witness to 'pole' to make this pass.",
    ).toBe(10);
  });

  test('_positive and _negative variants exist for every value pair', () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      expect(FEAR_PROSE[`${pair}_positive`]).toBeDefined();
      expect(FEAR_PROSE[`${pair}_negative`]).toBeDefined();
    });
  });

  test('positive and negative variants for each pair are distinct', () => {
    ALL_VALUE_PAIRS.forEach((pair) => {
      const positiveSet = new Set(FEAR_PROSE[`${pair}_positive`]);
      FEAR_PROSE[`${pair}_negative`].forEach((template) => {
        expect(positiveSet.has(template)).toBe(false);
      });
    });
  });
});

// ─── Table 10: HIDDEN_MOTIVE_PROSE ──────────────────────────────────────────

describe('HIDDEN_MOTIVE_PROSE', () => {
  validateKeyedTable(HIDDEN_MOTIVE_PROSE, ALL_STRATEGIES, ['{name}', '{strategy_description}'], 'HIDDEN_MOTIVE_PROSE');

  test('covers all 5 cooperation strategies', () => {
    expect(Object.keys(HIDDEN_MOTIVE_PROSE).length).toBe(ALL_STRATEGIES.length);
  });

  test('uses hyphens, not underscores, for strategy keys', () => {
    const keys = Object.keys(HIDDEN_MOTIVE_PROSE);
    expect(keys).not.toContain('tit_for_tat');
    expect(keys).not.toContain('always_cooperate');
    expect(keys).not.toContain('always_defect');
    expect(keys).toContain('tit-for-tat');
    expect(keys).toContain('always-cooperate');
    expect(keys).toContain('always-defect');
  });
});

// ─── Table 11: STORY_ARC_PROSE ──────────────────────────────────────────────

describe('STORY_ARC_PROSE', () => {
  validateKeyedTable(STORY_ARC_PROSE, ALL_ARCHETYPES, ['{name}', '{arc_phase}'], 'STORY_ARC_PROSE');

  test('covers all 19 narrative archetypes', () => {
    expect(Object.keys(STORY_ARC_PROSE).length).toBe(ALL_ARCHETYPES.length);
  });
});

// ─── Table 12: DIVINE_TRANSFORMATION_PROSE ──────────────────────────────────

describe('DIVINE_TRANSFORMATION_PROSE', () => {
  validateKeyedTable(
    DIVINE_TRANSFORMATION_PROSE, ALL_BRACKETS,
    ['{name}', '{ascendant_sphere}'],
    'DIVINE_TRANSFORMATION_PROSE',
  );

  test('each bracket has at least 3 templates', () => {
    ALL_BRACKETS.forEach((bracket) => {
      expect(DIVINE_TRANSFORMATION_PROSE[bracket].length).toBeGreaterThanOrEqual(3);
    });
  });

  test('uses low/medium/high/massive keys (not beyond)', () => {
    const keys = Object.keys(DIVINE_TRANSFORMATION_PROSE);
    expect(keys).toContain('low');
    expect(keys).toContain('medium');
    expect(keys).toContain('high');
    expect(keys).toContain('massive');
    expect(keys).not.toContain('beyond');
  });

  test('covers all 4 brackets', () => {
    expect(Object.keys(DIVINE_TRANSFORMATION_PROSE).length).toBe(ALL_BRACKETS.length);
  });
});

// ─── Cross-table consistency ─────────────────────────────────────────────────

describe('Cross-table consistency', () => {
  test('SURFACE_ORIGIN_PROSE and STORY_ARC_PROSE cover the same archetype keys', () => {
    const surfaceKeys = Object.keys(SURFACE_ORIGIN_PROSE).sort();
    const arcKeys = Object.keys(STORY_ARC_PROSE).sort();
    expect(surfaceKeys).toEqual(arcKeys);
  });

  test('BOND_HISTORY_PROSE and BOND_HISTORY_NEGATIVE_PROSE cover the same bond basis keys', () => {
    const positiveKeys = Object.keys(BOND_HISTORY_PROSE).sort();
    const negativeKeys = Object.keys(BOND_HISTORY_NEGATIVE_PROSE).sort();
    expect(positiveKeys).toEqual(negativeKeys);
  });

  test('TURNING_POINT_PROSE and CONTRADICTION_PROSE cover the same value pair keys', () => {
    const turningKeys = Object.keys(TURNING_POINT_PROSE).sort();
    const contradictionKeys = Object.keys(CONTRADICTION_PROSE).sort();
    expect(turningKeys).toEqual(contradictionKeys);
  });

  test('FEAR_PROSE key count is double the value pair count (positive + negative per pair)', () => {
    expect(Object.keys(FEAR_PROSE).length).toBe(Object.keys(TURNING_POINT_PROSE).length * 2);
  });

  test('no template uses {archetype} as a sphere name or vice versa', () => {
    // Sphere templates should only have {sphere}, not {archetype}
    ALL_SPHERES.forEach((sphere) => {
      SURFACE_SPHERE_PROSE[sphere].forEach((template) => {
        expect(template).not.toContain('{archetype}');
      });
    });
  });
});

// ─── Prose quality (Threadbare aesthetic) ────────────────────────────────────

describe('Prose quality (Threadbare aesthetic)', () => {
  test('avoids generic fantasy clichés', () => {
    const clichés = [
      'ancient evil',
      'chosen one',
      'brave warrior',
      'noble knight',
      'valiant hero',
      'magical portal',
      'eldritch',
    ];

    const allTemplates: string[] = [
      ...Object.values(SURFACE_ORIGIN_PROSE).flat(),
      ...Object.values(SURFACE_SPHERE_PROSE).flat(),
      ...Object.values(STORY_ARC_PROSE).flat(),
    ];

    allTemplates.forEach((template) => {
      clichés.forEach((cliché) => {
        expect(template.toLowerCase()).not.toContain(cliché.toLowerCase());
      });
    });
  });

  test('DECISIVE_NATURE_PROSE conveys psychological depth, not simple positivity', () => {
    const simplePositives = ['cheerful', 'happy', 'joyful', 'delightful'];
    DECISIVE_NATURE_PROSE.forEach((entry) => {
      simplePositives.forEach((word) => {
        expect(entry.toLowerCase()).not.toContain(word);
      });
    });
  });

  test('FEAR_PROSE templates reference psychological vulnerability, not physical danger', () => {
    // Spot-check: fear templates should not be purely physical threat descriptions
    const physicalOnlyThreat = /^The \w+ attacks/;
    ALL_FEAR_KEYS.forEach((key) => {
      FEAR_PROSE[key].forEach((template) => {
        expect(physicalOnlyThreat.test(template)).toBe(false);
      });
    });
  });
});
