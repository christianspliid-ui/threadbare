import { describe, expect, it } from 'vitest';
import { parseEncounterContract } from '../encounter-contract-validators';
import {
  ENCOUNTER_CONTRACT_METADATA_KEY,
  toEncounterArchetypePole,
  type EncounterAuthoredChoice,
} from '../encounter-contract-builder';
import {
  ARCANE_CIRCLE_ENCOUNTER_TEMPLATES,
  ARCANE_CIRCLE_SOCIAL_TEMPLATES,
} from '../arcane-circle-encounter-content';
import {
  BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES,
  BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES,
} from '../builders-fellowship-encounter-content';
import {
  CIVIC_GUARD_ENCOUNTER_TEMPLATES,
  CIVIC_GUARD_SOCIAL_TEMPLATES,
} from '../civic-guard-encounter-content';
import {
  HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES,
  HOLY_ORDER_DAWN_SOCIAL_TEMPLATES,
} from '../holy-order-dawn-encounter-content';
import {
  LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES,
  LOREKEEPERS_SOCIAL_TEMPLATES,
} from '../lorekeepers-covenant-encounter-content';
import {
  MERCENARY_ENCOUNTER_TEMPLATES,
  MERCENARY_SOCIAL_TEMPLATES,
} from '../mercenary-encounter-content';
import {
  MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES,
  MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES,
} from '../merchant-consortium-encounter-content';
import {
  RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES,
  RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES,
} from '../rangers-brotherhood-encounter-content';
import {
  TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES,
  TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES,
} from '../temple-of-spheres-encounter-content';
import {
  THIEVES_GUILD_ENCOUNTER_TEMPLATES,
  THIEVES_GUILD_SOCIAL_TEMPLATES,
} from '../thieves-guild-encounter-content';
import {
  UNDERKING_COURT_ENCOUNTER_TEMPLATES,
  UNDERKING_COURT_SOCIAL_TEMPLATES,
} from '../underking-court-encounter-content';

const FACTION_TEMPLATES = [
  ...ARCANE_CIRCLE_ENCOUNTER_TEMPLATES,
  ...ARCANE_CIRCLE_SOCIAL_TEMPLATES,
  ...BUILDERS_FELLOWSHIP_ENCOUNTER_TEMPLATES,
  ...BUILDERS_FELLOWSHIP_SOCIAL_TEMPLATES,
  ...CIVIC_GUARD_ENCOUNTER_TEMPLATES,
  ...CIVIC_GUARD_SOCIAL_TEMPLATES,
  ...HOLY_ORDER_DAWN_ENCOUNTER_TEMPLATES,
  ...HOLY_ORDER_DAWN_SOCIAL_TEMPLATES,
  ...LOREKEEPERS_COVENANT_ENCOUNTER_TEMPLATES,
  ...LOREKEEPERS_SOCIAL_TEMPLATES,
  ...MERCENARY_ENCOUNTER_TEMPLATES,
  ...MERCENARY_SOCIAL_TEMPLATES,
  ...MERCHANT_CONSORTIUM_ENCOUNTER_TEMPLATES,
  ...MERCHANT_CONSORTIUM_SOCIAL_TEMPLATES,
  ...RANGERS_BROTHERHOOD_ENCOUNTER_TEMPLATES,
  ...RANGERS_BROTHERHOOD_SOCIAL_TEMPLATES,
  ...TEMPLE_OF_SPHERES_ENCOUNTER_TEMPLATES,
  ...TEMPLE_OF_SPHERES_SOCIAL_TEMPLATES,
  ...THIEVES_GUILD_ENCOUNTER_TEMPLATES,
  ...THIEVES_GUILD_SOCIAL_TEMPLATES,
  ...UNDERKING_COURT_ENCOUNTER_TEMPLATES,
  ...UNDERKING_COURT_SOCIAL_TEMPLATES,
];

function decodeContractMetadata(value: string | undefined) {
  expect(value).toBeDefined();
  expect(value).toMatch(new RegExp(`^${ENCOUNTER_CONTRACT_METADATA_KEY}:`));
  const encoded = value!.slice(ENCOUNTER_CONTRACT_METADATA_KEY.length + 1);
  return parseEncounterContract(JSON.parse(encoded));
}

describe('faction encounter contract migration', () => {
  it('round-trips all faction encounter + social templates through parseEncounterContract', () => {
    expect(FACTION_TEMPLATES.length).toBeGreaterThan(0);

    for (const template of FACTION_TEMPLATES) {
      const contract = decodeContractMetadata(template.illustrationAlt);
      expect(contract.encounter.id).toBe(template.id);
    }
  });

  it('uses heuristic pole mapping for coercive and non-coercive authored choices', () => {
    const coerciveChoice = {
      id: 'choice.coercive',
      label: 'Force the issue',
      interventionType: 'coercive',
    } as EncounterAuthoredChoice;

    const supportiveChoice = {
      id: 'choice.supportive',
      label: 'Support the effort',
      interventionType: 'supportive',
    } as EncounterAuthoredChoice;

    expect(toEncounterArchetypePole('heart', coerciveChoice)).toBe('renegade');
    expect(toEncounterArchetypePole('heart', supportiveChoice)).toBe('sworn');
  });
});
