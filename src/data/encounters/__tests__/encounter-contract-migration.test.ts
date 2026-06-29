import { describe, expect, it } from 'vitest';
import { adaptUnifiedActionTemplateToEncounterContract } from '../../../engine/encounter-contract-adapter';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';

const ENCOUNTER_CONTRACT_METADATA_PREFIX = '__encounter_contract_v1:';

const encounterModules = import.meta.glob('../*.ts', { eager: true }) as Record<string, Record<string, unknown>>;

function collectTemplates(): UnifiedActionTemplate[] {
  const templates: UnifiedActionTemplate[] = [];
  for (const moduleExports of Object.values(encounterModules)) {
    for (const [exportName, exportValue] of Object.entries(moduleExports)) {
      if (exportName.endsWith('_TEMPLATE') && exportValue && typeof exportValue === 'object') {
        templates.push(exportValue as UnifiedActionTemplate);
      }
    }
  }
  return templates.sort((a, b) => a.id.localeCompare(b.id));
}

describe('branching encounters migrate to encoded EncounterContract metadata', () => {
  const templates = collectTemplates();

  it('loads all branching encounter templates in src/data/encounters', () => {
    // 24th: apotheosis-ascension (THR-479).
    // 25th + 26th: the-comet-at-the-turning (cosmic) + the-wall-of-the-mason-lord (regional), THR-466.
    expect(templates).toHaveLength(26);
  });

  it('encodes contract metadata and exposes authored poles for every choice', () => {
    for (const template of templates) {
      expect(template.illustrationAlt).toBeTruthy();
      expect(template.illustrationAlt!.startsWith(ENCOUNTER_CONTRACT_METADATA_PREFIX)).toBe(true);

      const contract = adaptUnifiedActionTemplateToEncounterContract(template);
      expect(contract.encounter.id).toBe(template.id);
      expect(contract.encounter.beats.length).toBeGreaterThan(0);

      for (const beat of contract.encounter.beats) {
        expect(beat.encounter_choices.length).toBeGreaterThan(0);
        for (const choice of beat.encounter_choices) {
          expect(choice.moral_axis_pole).toBeTruthy();
        }
      }
    }
  });
});
