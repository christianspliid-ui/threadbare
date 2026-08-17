/**
 * THR-1150 — corpus lint: every authored faction id on an aftermath effect must
 * name something the engine can resolve.
 *
 * `bindFactionDefinitionIds` resolves a **definition** id (`'mercenary_company'`)
 * to the seeded faction **node** id (`faction_def_mercenary_company_0`). That fixes
 * the whole shipped corpus, but it fixes it only for ids that name a real
 * definition: a typo resolves to nothing and the effect silently no-ops again —
 * the exact failure mode this ticket exists to close.
 *
 * So the corpus is pinned here rather than left to the resolver's fail-soft path.
 * A `$`-prefixed value is a scene sentinel bound at dispatch (`$target`, `$cast:x`)
 * and is not an id to check.
 */
import { describe, expect, it } from 'vitest';
import { UNIFIED_ACTION_TEMPLATES } from '../../data/unified-action-templates';
import { FACTION_DEFINITIONS } from '../../data/faction-definitions';

/** Effect kinds and the fields on each that name a faction. Mirrors `FACTION_ID_FIELDS_BY_KIND`. */
const FACTION_ID_FIELDS: Readonly<Record<string, readonly string[]>> = {
  faction_reputation_gain: ['factionId'],
  faction_dissolve: ['factionId'],
  signature_warhost: ['factionId'],
  faction_absorb: ['absorbingFactionId', 'absorbedFactionId'],
  faction_declare_war: ['factionA', 'factionB'],
  faction_force_peace: ['factionA', 'factionB'],
  faction_splinter: ['sourceFactionId'],
  membership_change: ['factionId'],
};

interface Finding {
  readonly templateId: string;
  readonly kind: string;
  readonly field: string;
  readonly value: string;
}

/**
 * Deep-walk a template for faction-id-carrying effects. Effects sit at several
 * depths (step `effects`, aftermath `reactions`, `byOutcome` bands), so this walks
 * the object rather than assuming one shape — a new nesting cannot slip past it.
 */
function collectFactionIds(node: unknown, templateId: string, out: Finding[], seen: Set<object>): void {
  if (node === null || typeof node !== 'object') return;
  if (seen.has(node as object)) return;
  seen.add(node as object);

  if (Array.isArray(node)) {
    for (const item of node) collectFactionIds(item, templateId, out, seen);
    return;
  }

  const record = node as Record<string, unknown>;
  const kind = record.kind;
  if (typeof kind === 'string' && FACTION_ID_FIELDS[kind]) {
    for (const field of FACTION_ID_FIELDS[kind]) {
      const value = record[field];
      if (typeof value === 'string' && value.length > 0 && !value.startsWith('$')) {
        out.push({ templateId, kind, field, value });
      }
    }
  }

  for (const value of Object.values(record)) collectFactionIds(value, templateId, out, seen);
}

function collectCorpus(): Finding[] {
  const out: Finding[] = [];
  for (const template of UNIFIED_ACTION_TEMPLATES) {
    collectFactionIds(template, template.id, out, new Set());
  }
  return out;
}

describe('THR-1150 — authored faction ids resolve', () => {
  it('every authored faction id on an aftermath effect names a known faction definition', () => {
    const findings = collectCorpus();
    const unknown = findings.filter(f => !FACTION_DEFINITIONS.has(f.value));

    expect(
      unknown,
      `Authored faction ids naming no FACTION_DEFINITIONS entry — these resolve to nothing and no-op silently:\n${
        unknown.map(f => `  ${f.templateId}: ${f.kind}.${f.field} = '${f.value}'`).join('\n')
      }`,
    ).toEqual([]);
  });

  it('the corpus actually contains faction_reputation_gain effects to check', () => {
    // Guards against the vacuous pass: an empty walk satisfies the assertion above
    // for free, so the population is pinned here rather than assumed.
    const gains = collectCorpus().filter(f => f.kind === 'faction_reputation_gain');
    expect(gains.length).toBeGreaterThan(0);
  });
});
