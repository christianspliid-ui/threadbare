/**
 * THR-1733 — the scene picture's label is words, never the encoded contract.
 */
import { describe, expect, it } from 'vitest';
import {
  illustrationAltText,
  renderableIllustrationUrl,
  SCENE_ALT_NAMELESS,
  SCENE_ALT_PREFIX,
} from '../encounterIllustration';
import {
  ADAPTER_CONTRACT_METADATA_KEY,
  isEncounterContractMetadata,
} from '../../../encounter-contract-adapter';
import {
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../../../data/unified-action-templates';
import type { UnifiedActionTemplate } from '../../../../types/unifiedAction';

/** Every `*_TEMPLATE` exported from the authored encounter files — the registries miss some. */
const encounterModules = import.meta.glob('../../../../data/encounters/*.ts', { eager: true }) as Record<
  string,
  Record<string, unknown>
>;

function authoredEncounterTemplates(): UnifiedActionTemplate[] {
  const out: UnifiedActionTemplate[] = [];
  for (const moduleExports of Object.values(encounterModules)) {
    for (const [name, value] of Object.entries(moduleExports)) {
      if (name.endsWith('_TEMPLATE') && value && typeof value === 'object') out.push(value as UnifiedActionTemplate);
    }
  }
  return out;
}

const PAYLOAD = `${ADAPTER_CONTRACT_METADATA_KEY}:{"encounter":{"id":"x"}}`;

/**
 * Floors so the sweep cannot pass empty. The plan counted 23 contract files that mention an
 * `illustrationUrl`; 5 of them (rival-shrine-betrayal, the-brink-rescue, the-courtyard-duel,
 * the-letters-of-introduction, wandering-healer-shrine-access) only carry the never-shipped
 * placeholder, so 18 render a real painting on 2026-11-07.
 */
const MIN_CONTRACT_TEMPLATES = 23;
const MIN_PAINTED_CONTRACT_TEMPLATES = 18;
const MAX_ALT_LENGTH = 300;

describe('illustrationAltText (THR-1733)', () => {
  it('replaces a contract payload with the scene name', () => {
    expect(illustrationAltText({ illustrationAlt: PAYLOAD, name: 'Road Ambush' })).toBe(
      `${SCENE_ALT_PREFIX} Road Ambush`,
    );
  });

  it('replaces a malformed payload without parsing it', () => {
    expect(
      illustrationAltText({ illustrationAlt: `${ADAPTER_CONTRACT_METADATA_KEY}:{not json`, name: 'X' }),
    ).toBe(`${SCENE_ALT_PREFIX} X`);
  });

  it('keeps authored prose', () => {
    expect(illustrationAltText({ illustrationAlt: 'A gate at dusk', name: 'Gate' })).toBe('A gate at dusk');
  });

  it('falls back on absent or blank alt', () => {
    expect(illustrationAltText({ name: 'Gate' })).toBe(`${SCENE_ALT_PREFIX} Gate`);
    expect(illustrationAltText({ illustrationAlt: '   ', name: 'Gate' })).toBe(`${SCENE_ALT_PREFIX} Gate`);
  });

  it('names a nameless scene without a dangling prefix', () => {
    expect(illustrationAltText({ illustrationAlt: PAYLOAD, name: '  ' })).toBe(SCENE_ALT_NAMELESS);
    expect(illustrationAltText({})).toBe(SCENE_ALT_NAMELESS);
  });

  it('recognises payloads by prefix only', () => {
    expect(isEncounterContractMetadata(PAYLOAD)).toBe(true);
    expect(isEncounterContractMetadata(ADAPTER_CONTRACT_METADATA_KEY)).toBe(false);
    expect(isEncounterContractMetadata(undefined)).toBe(false);
    expect(isEncounterContractMetadata('A gate at dusk')).toBe(false);
  });
});

describe('catalogue sweep — no painted scene speaks its contract (THR-1733)', () => {
  const byId = new Map<string, UnifiedActionTemplate>();
  for (const t of [...UNIFIED_ACTION_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES, ...authoredEncounterTemplates()]) {
    if (!byId.has(t.id)) byId.set(t.id, t);
  }
  const painted = [...byId.values()].filter((t) => renderableIllustrationUrl(t.illustrationUrl));
  const paintedContract = painted.filter((t) => isEncounterContractMetadata(t.illustrationAlt));
  const contract = [...byId.values()].filter((t) => isEncounterContractMetadata(t.illustrationAlt));

  it(`meets at least ${MIN_CONTRACT_TEMPLATES} contract templates`, () => {
    expect(contract.length).toBeGreaterThanOrEqual(MIN_CONTRACT_TEMPLATES);
  });

  it(`meets at least ${MIN_PAINTED_CONTRACT_TEMPLATES} painted contract templates`, () => {
    expect(paintedContract.length).toBeGreaterThanOrEqual(MIN_PAINTED_CONTRACT_TEMPLATES);
  });

  it('every template yields a short, payload-free label', () => {
    const offenders = [...byId.values()]
      .map((t) => ({ id: t.id, alt: illustrationAltText(t) }))
      .filter(({ alt }) => alt.startsWith(ADAPTER_CONTRACT_METADATA_KEY) || alt.includes('{') || alt.length >= MAX_ALT_LENGTH);
    expect(offenders).toEqual([]);
  });
});
