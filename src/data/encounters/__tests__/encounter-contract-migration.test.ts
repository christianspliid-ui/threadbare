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

/**
 * Templates in this directory that are deliberately **outside** the EncounterContract v1
 * migration (THR-1221).
 *
 * The migration is closed history: it encoded contract metadata into `illustrationAlt` for
 * the branching corpus that authored `encounter_choices`. Nudge-native content authored
 * after WS5 (THR-1086) does not participate — it authors no `authoredChoices` at all, which
 * is the *rejected* model, so it has no choices to expose poles for and nothing to encode.
 *
 * This list exists rather than a bumped count because the two assertions below were
 * scoped by a directory glob while their subject is a closed migration. A bare
 * `toHaveLength(N)` made every new encounter look like a regression and invited the fix
 * of cargo-culting a dead encoding into new content to make the red go away. Naming the
 * exclusions instead makes each one a deliberate act: adding a nudge-native encounter
 * means adding its id here and saying why, and adding a *branching* one that belongs in
 * the migration still goes red, which is the case worth catching.
 */
const OUTSIDE_CONTRACT_MIGRATION: readonly string[] = [
  'encounter.border.the_unclaimed_relic',
  'encounter.border.one_body_short',
  'encounter.border.toll_of_blades',
  'encounter.border.the_sign_over_the_ruin',
  'encounter.border.standing_the_line',
  'encounter.border.the_garrisons_price',
];

describe('branching encounters migrate to encoded EncounterContract metadata', () => {
  const allTemplates = collectTemplates();
  const templates = allTemplates.filter(t => !OUTSIDE_CONTRACT_MIGRATION.includes(t.id));

  it('loads all branching encounter templates in src/data/encounters', () => {
    // 24th: apotheosis-ascension (THR-479).
    // 25th + 26th: the-comet-at-the-turning (cosmic) + the-wall-of-the-mason-lord (regional), THR-466.
    // 27th–29th: the-page-beneath-the-saint (veil) + the-verdict-that-burns (eye) + the-granaries-in-the-famine-year (gold), regional, THR-466.
    expect(templates).toHaveLength(29);
  });

  it('every excluded template really is in this directory and really is unmigrated', () => {
    // Keeps the exclusion list honest in both directions. Without this, a typo'd or stale
    // id would silently exclude nothing while still reading as a maintained decision, and
    // an entry that later *gained* contract metadata would go on being skipped by a test
    // it now passes.
    const present = allTemplates.map(t => t.id);
    for (const id of OUTSIDE_CONTRACT_MIGRATION) {
      expect(present, `excluded id "${id}" names no template in this directory`).toContain(id);
      const template = allTemplates.find(t => t.id === id)!;
      expect(
        template.illustrationAlt?.startsWith(ENCOUNTER_CONTRACT_METADATA_PREFIX) ?? false,
        `"${id}" now carries contract metadata — drop it from OUTSIDE_CONTRACT_MIGRATION`,
      ).toBe(false);
    }
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
