/**
 * THR-2010 — pins the Reach relabels from the mislabel audit
 * (`Docs/audits/2026-10-21-thr-1940-reach-mislabel-worklist.md` § 3 Relabel /
 * Step relabel rows, § 5 proof templates). Each entry is the template Reach
 * then every runnable step's Reach in authored order, as the catalogue
 * resolves them (legacy aliases already normalised). A step with no own Reach
 * (an authored-choice step whose variants carry it) reads `undefined`.
 */
import { describe, expect, it } from 'vitest';
import { REACH_DOMAINS } from '../../types/traits';
import type { UnifiedActionTemplate } from '../../types/unifiedAction';
import { entriesOfKind } from '../contentCatalogs';
import { getUnifiedTemplateById } from '../unified-action-templates';

const RELABELLED: Record<string, readonly [string, readonly (string | undefined)[]]> = {
  // § 3 Relabel
  'ag.quest.recover_artifact': ['iron', ['eye', 'shadow', 'iron']],
  'encounter.blessing_of_passage': ['veil', ['veil', 'veil', 'veil']],
  'encounter.forbidden_tome': ['shadow', ['eye', 'veil', 'shadow']],
  'encounter.garrison_gossip': ['eye', ['heart', 'shadow', 'eye']],
  'encounter.gather_firewood': ['stone', ['eye', 'stone', 'stone']],
  'encounter.guild_initiation_trial': ['heart', ['iron', 'heart']],
  'encounter.harvest_bounty': ['stone', ['stone', 'stone', 'gold']],
  'encounter.healer_aid': ['heart', ['eye', 'eye', 'heart']],
  'encounter.healers_oath': ['stone', ['eye', 'heart', 'stone']],
  'encounter.inspect_the_armoury': ['eye', ['gold', 'iron', 'eye']],
  'encounter.library_expansion': ['stone', ['gold', 'eye', 'stone']],
  'encounter.listen_for_rumors': ['eye', ['shadow', 'eye']],
  'encounter.mend_fishing_nets': ['stone', ['stone', 'stone', 'gold']],
  'encounter.rally_faithful': ['heart', ['heart', 'heart', 'heart']],
  'encounter.rally_the_locals': ['heart', ['eye', 'heart']],
  'encounter.sharpen_blades': ['stone', ['iron', 'stone']],
  'encounter.slice.riders_behind_caravan': ['shadow', ['eye', 'shadow']],
  'encounter.slice.snow_on_the_pass': ['star', ['star', 'stone']],
  'encounter.slice.unsafe_bridge': ['star', ['star']],
  // Held at Star (THR-2010): on the everyday settlement board it is one of the
  // three master-band Star templates, so Eye would put Star under its master
  // floor (`EVERYDAY_FLOOR_BY_BAND.master`). Its sequel follows it. TODO(THR-2014)
  'encounter.town.easter_reckoning': ['star', ['star', 'star']],
  'encounter.trial_of_flame': ['stone', ['iron', 'stone', 'stone']],
  'hod.senior.inquisition': ['iron', ['eye', 'iron']],
  'hunt.trail_cold': ['star', ['star']],
  'mct.social.guild_feast': ['gold', ['gold']],
  'mct.social.wine_tasting': ['gold', ['gold']],
  'tavern.drinking_contest': ['stone', ['stone', 'stone']],
  'town.easter_reckoning_heard': ['star', ['star']],
  'ts.elite.found_cathedral': ['veil', ['veil', 'veil', 'veil']],
  'ts.quest.consecrate_ground': ['veil', ['veil', 'veil']],
  'ts.quest.tend_shrine': ['veil', ['veil', 'veil']],
  'ts.senior.banish_corruption': ['veil', ['veil', 'veil']],
  'ts.social.evening_prayer': ['veil', ['veil']],
  // § 3 Step relabel — the template Reach stays
  'encounter.council_mediation': ['heart', ['heart', 'heart', 'heart']],
  'encounter.militia_aid': ['iron', ['iron', 'heart', 'iron']],
  'faction.encounter.dissent_surfaces': ['shadow', ['heart', 'heart']],
  'faction.encounter.doctrine_surfaces': ['star', ['heart', 'heart']],
  'faction.encounter.doubter_chooses': ['eye', ['eye', 'heart']],
  'reputation.iron.the_executioners_commission': ['iron', ['iron', undefined]],
  // § 5 proof templates
  'encounter.shell_proof.fate_card_trial': ['stone', ['stone', 'stone']],
  'encounter.shell_proof.reckless_wager': ['star', ['star']],
  'encounter.shell_proof.tiered_proving': ['iron', ['iron']],
};

describe('THR-2010 Reach relabels', () => {
  it('pins all 41 audited ids', () => {
    expect(Object.keys(RELABELLED)).toHaveLength(41);
  });

  it.each(Object.entries(RELABELLED))('%s reads its audited template and step Reaches', (id, [reach, steps]) => {
    const template = getUnifiedTemplateById(id);
    expect(template, id).toBeDefined();
    expect(template!.reach).toBe(reach);
    expect(template!.steps.map((step) => step.reach)).toEqual(steps);
  });

  it('moves the executioner\'s warn arm to Shadow', () => {
    const template = getUnifiedTemplateById('reputation.iron.the_executioners_commission')!;
    const variants = (template.steps[1] as { variants?: Record<string, { reach?: string }> }).variants ?? {};
    expect(variants.refuse_and_warn_the_condemned?.reach).toBe('shadow');
  });

  it('gives the reckless wager a sphere of the Twelve', () => {
    expect(getUnifiedTemplateById('encounter.shell_proof.reckless_wager')!.sphere).toBe('chaos');
  });

  it('moves garrison gossip\'s reward tag with its Reach', () => {
    const file = getUnifiedTemplateById('encounter.garrison_gossip')!.steps[2];
    expect(file.successMetadata?.rewardPool?.tagFilters).toEqual(['#eye']);
  });

  // The coverage pre-check `out_of_eight_reach` runs over this same catalogue
  // (`scripts/judge-encounters.ts`): the encounter_template kind.
  it('leaves no encounter template declaring a Reach outside the Eight', () => {
    const eight: readonly string[] = REACH_DOMAINS;
    const outside = entriesOfKind('encounter_template')
      .map((entry) => entry as unknown as UnifiedActionTemplate)
      .filter((template) => !eight.includes(template.reach))
      .map((template) => `${template.id}: ${template.reach}`);
    expect(outside).toEqual([]);
  });
});
