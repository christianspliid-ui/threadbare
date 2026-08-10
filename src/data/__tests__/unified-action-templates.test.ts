import { describe, it, expect } from 'vitest';
import {
  UNIFIED_ACTION_TEMPLATES,
  migrateActionTemplate,
  getUnifiedTemplateById,
} from '../unified-action-templates';
import { ACTION_TEMPLATES } from '../action-template-content';
import { ENCOUNTER_TEMPLATES } from '../encounter-content';
import type { UnifiedActionTemplate, ActionStep } from '../../types/unifiedAction';
import { isActionStepBranch } from '../../types/unifiedAction';
import { STARTER_ACTION_COUNT, STARTER_ACTION_IDS } from '../../engine/actionUnlock';
import { REACH_SUBLOCATION_MENU } from '../../engine/settlementGenome/reachMenu';
import { SPHERE_SUBLOCATION_MENU } from '../../engine/settlementGenome/sphereMenu';
import { SETTLEMENT_INFRASTRUCTURE } from '../../engine/settlementGenome/infrastructure';
import { SUBTYPE_SUBLOCATION_MAP } from '../../engine/sublocation';
import { GOLD_SUBLOCATION_SPECS } from '../../engine/phaseSublocations';

// ─── Migration helpers ────────────────────────────────────────────

describe('migrateActionTemplate', () => {
  it('produces exactly 1 step per action template', () => {
    for (const old of ACTION_TEMPLATES) {
      const unified = migrateActionTemplate(old);
      expect(unified.steps).toHaveLength(1);
    }
  });

  it('preserves id, name, reach, crudType', () => {
    const old = ACTION_TEMPLATES[0];
    const unified = migrateActionTemplate(old);
    expect(unified.id).toBe(old.id);
    expect(unified.name).toBe(old.name);
    expect(unified.reach).toBe(old.reach);
    expect(unified.crudType).toBe(old.crudType);
  });

  it('maps faction affinity to regional scale', () => {
    const factionTemplate = {
      ...ACTION_TEMPLATES[0],
      id: 'test.faction',
      actorAffinities: ['faction' as const],
    };
    const unified = migrateActionTemplate(factionTemplate);
    expect(unified.scale).toBe('regional');
  });

  it('maps individual-only affinity to personal scale', () => {
    // Create a synthetic individual-only template for the test
    const individualTemplate = {
      ...ACTION_TEMPLATES[0],
      id: 'test.individual',
      actorAffinities: ['individual' as const],
    };
    const unified = migrateActionTemplate(individualTemplate);
    expect(unified.scale).toBe('personal');
  });

  it('defaults to regional scale when no affinity set', () => {
    const noAffinityTemplate = { ...ACTION_TEMPLATES[0], id: 'test.noaffinity', actorAffinities: undefined };
    const unified = migrateActionTemplate(noAffinityTemplate);
    expect(unified.scale).toBe('regional');
  });

  it('preserves step difficulty, duration, and GraphOps', () => {
    const old = ACTION_TEMPLATES[0];
    const unified = migrateActionTemplate(old);
    const step = unified.steps[0];
    expect(step.difficulty).toBe(old.difficulty);
    expect(step.duration.min).toBe(old.durationRange.min);
    expect(step.duration.max).toBe(old.durationRange.max);
    expect(step.onSuccess).toEqual(old.onSuccess);
    expect(step.onFailure).toEqual(old.onFailure);
  });

  it('apCost is 1', () => {
    const unified = migrateActionTemplate(ACTION_TEMPLATES[0]);
    expect(unified.apCost).toBe(1);
  });
});

describe('ENCOUNTER_TEMPLATES (UnifiedActionTemplate[])', () => {
  it('every step has difficulty in [0, 1]', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      for (const step of enc.steps) {
        expect(step.difficulty).toBeGreaterThanOrEqual(0);
        expect(step.difficulty).toBeLessThanOrEqual(1);
      }
    }
  });

  it('scale is always local', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      expect(enc.scale).toBe('local');
    }
  });

  it('reach is defined', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      expect(enc.reach).toBeTruthy();
    }
  });

  it('actorAffinities targets an actor: individual, or group-exclusive with minGroupMembers', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      const affinities = enc.actorAffinities ?? [];
      if (affinities.includes('individual')) continue;
      // THR-74: party-exclusive delves are deliberately ['group']-only — no
      // 'individual', so only a company can draw them. They are the sole
      // exception to the individual-actor default, and must carry the gate's
      // consumer field so they are reachable rather than orphaned.
      expect(affinities, `${enc.id} has no 'individual' affinity, so must be group-exclusive`).toContain('group');
      expect(enc.minGroupMembers, `${enc.id} is group-exclusive and must set minGroupMembers`).toBeGreaterThanOrEqual(2);
    }
  });
});

// ─── Sublocation gating (THR-731 PR 4) ────────────────────────────

/**
 * Every sublocation a template gates on must be one worldgen can actually mint. A
 * template naming a sublocation type that does not exist is not a soft mismatch — it
 * is silently **unreachable**, and nothing else in the suite notices: the template
 * validates, ships, scores, and simply never draws.
 *
 * This exists because THR-731 PR 3 shipped `The Guild Falls` — the capstone
 * confrontation of the whole ticket — gating on `sublocation-type.guildhall` while
 * worldgen mints `sublocation-type.guild-hall`. One missing hyphen, zero matches on
 * every seed, and the encounter could not be drawn by construction. It took a live
 * run to notice; this test catches it at authoring time.
 *
 * Two deliberate choices about *where* it reads:
 *
 * 1. It asserts over `locationSubtypes` on the assembled templates, not the authored
 *    `sublocationTypes` field. `toUnifiedTemplate` folds `locationTypes` and
 *    `sublocationTypes` into that one array, so the authored field does not survive
 *    onto `UnifiedActionTemplate` at all — a check reading `template.sublocationTypes`
 *    matches nothing and passes vacuously (which is exactly how the first draft of
 *    this test "passed" with the bug reintroduced). Reading the merged array also
 *    covers every content file feeding the registry, not just encounter-content.ts.
 * 2. The `sublocation-type.` prefix is what distinguishes a sublocation entry from a
 *    location subtype (`town`, `ruins`) sharing the same array.
 *
 * The mintable set is *derived* from the five sources that mint sublocations — the
 * four worldgen menus plus the runtime `phaseSublocations` specs — never hand-listed,
 * so it cannot drift from the generators.
 */
describe('template sublocation gating', () => {
  it('every gated sublocation-type id is one worldgen can mint', () => {
    const mintable = new Set<string>();
    for (const def of Object.values(REACH_SUBLOCATION_MENU) as { sublocations?: { id: string }[] }[]) {
      for (const s of def?.sublocations ?? []) mintable.add(s.id);
    }
    for (const def of Object.values(SPHERE_SUBLOCATION_MENU) as ({ sublocations?: { id: string }[] } | undefined)[]) {
      for (const s of def?.sublocations ?? []) mintable.add(s.id);
    }
    for (const s of SETTLEMENT_INFRASTRUCTURE) mintable.add(s.id);
    for (const defs of Object.values(SUBTYPE_SUBLOCATION_MAP)) {
      for (const d of defs) mintable.add(d.id);
    }
    // Emergent, minted at runtime by `phaseSublocations` rather than at worldgen —
    // mines, smugglers' dens, caravan rests. Omitting this source is what made the
    // first version of this test flag four legitimately-reachable templates.
    for (const spec of GOLD_SUBLOCATION_SPECS) mintable.add(spec.sublocationTypeId);
    // Sanity-check the derivation itself: an empty or tiny set would make the
    // assertion below vacuous rather than strict.
    expect(mintable.size).toBeGreaterThan(50);

    const gated: string[] = [];
    const unreachable: string[] = [];
    for (const template of UNIFIED_ACTION_TEMPLATES) {
      for (const entry of template.locationSubtypes ?? []) {
        if (!entry.startsWith('sublocation-type.')) continue;
        gated.push(entry);
        if (!mintable.has(entry)) unreachable.push(`${template.id} gates on '${entry}'`);
      }
    }

    // Guard against the vacuity that hid this bug the first time: if the merge shape
    // changes again and no sublocation entries reach this assertion, fail loudly
    // rather than reporting a green zero.
    expect(gated.length, 'no sublocation-gated templates found — the assertion below would be vacuous').toBeGreaterThan(0);

    expect(unreachable, `templates gating on sublocation types worldgen never mints:\n${unreachable.join('\n')}`)
      .toEqual([]);
  });
});

// ─── Unified template registry ────────────────────────────────────

describe('UNIFIED_ACTION_TEMPLATES', () => {
  it('has no duplicate IDs', () => {
    const ids = UNIFIED_ACTION_TEMPLATES.map(t => t.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('every template has at least 1 motivation OR is a divine/NPC template', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      if (
        t.scale !== 'cosmic' &&
        !t.id.startsWith('npc_') &&
        !t.id.startsWith('divine.self.') && // self-actions are ascendant-only; motivations N/A
        // THR-773: same rationale — Rekindle the Thread is `actorAffinities:
        // ['ascendant']`, so no mortal ever scores it and motivations are N/A.
        t.id !== 'divine.rekindle_thread'
      ) {
        // motivations may be undefined for some templates (e.g. migrated encounters
        // where motivations are optional); skip those
        if (t.motivations) {
          expect(t.motivations.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('every step has difficulty in [0, 1]', () => {
    /** Collect all concrete ActionSteps, expanding branch variants. */
    function concreteSteps(t: UnifiedActionTemplate): ActionStep[] {
      const result: ActionStep[] = [];
      for (const step of t.steps) {
        if (isActionStepBranch(step)) {
          result.push(...Object.values(step.variants), step.fallback);
        } else {
          result.push(step);
        }
      }
      return result;
    }
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of concreteSteps(t)) {
        expect(step.difficulty).toBeGreaterThanOrEqual(0);
        expect(step.difficulty).toBeLessThanOrEqual(1);
      }
    }
  });

  it('every step has duration.min <= duration.max', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of t.steps) {
        if (isActionStepBranch(step)) {
          for (const variant of [...Object.values(step.variants), step.fallback]) {
            expect(variant.duration.min).toBeLessThanOrEqual(variant.duration.max);
          }
        } else {
          expect(step.duration.min).toBeLessThanOrEqual(step.duration.max);
        }
      }
    }
  });

  it('every step has duration.min >= 1', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      for (const step of t.steps) {
        if (isActionStepBranch(step)) {
          for (const variant of [...Object.values(step.variants), step.fallback]) {
            expect(variant.duration.min).toBeGreaterThanOrEqual(1);
          }
        } else {
          expect(step.duration.min).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('action templates are present', () => {
    const actionCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('action.')).length;
    expect(actionCount).toBeGreaterThan(0);
  });

  it('all encounter templates are present', () => {
    const encounterIds = new Set(ENCOUNTER_TEMPLATES.map(t => t.id));
    const presentCount = UNIFIED_ACTION_TEMPLATES.filter(t => encounterIds.has(t.id)).length;
    expect(presentCount).toBe(ENCOUNTER_TEMPLATES.length);
  });

  it('divine templates are present', () => {
    const divineCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('divine.')).length;
    expect(divineCount).toBeGreaterThan(0);
  });

  it('total template count is substantial', () => {
    expect(UNIFIED_ACTION_TEMPLATES.length).toBeGreaterThanOrEqual(54);
  });

  it('starter action IDs resolve to live templates', () => {
    const byId = new Map(UNIFIED_ACTION_TEMPLATES.map((template) => [template.id, template]));
    for (const starterId of STARTER_ACTION_IDS) {
      expect(byId.has(starterId), `starter id '${starterId}' missing from templates`).toBe(true);
    }
  });

  it('exactly STARTER_ACTION_COUNT templates carry starter: true', () => {
    const starters = UNIFIED_ACTION_TEMPLATES.filter((template) => template.starter === true);
    expect(starters).toHaveLength(STARTER_ACTION_COUNT);
  });

  it('starter-flagged templates match STARTER_ACTION_IDS exactly', () => {
    const flaggedIds = new Set(
      UNIFIED_ACTION_TEMPLATES
        .filter((template) => template.starter === true)
        .map((template) => template.id),
    );
    const expectedIds = new Set(STARTER_ACTION_IDS);
    expect(flaggedIds).toEqual(expectedIds);
  });
});

// ─── Phase 17: spellName / description completeness ─────────────────

describe('Phase 17: spellName and description completeness', () => {
  /**
   * action.* and divine.* templates must all have spellName and description.
   * encounter.* templates are excluded — they are generated dynamically
   * from encounter-content.ts and will be enriched in a future pass.
   * hex.*, loc.*, artifact.*, sub.*, bind_thread.*, scry_agent, observe_agent etc.
   * are also covered by this test since they live in unified-action-templates.ts.
   */
  const SCOPED_PREFIXES = [
    'action.',
    'divine.',
    'hex.',
    'loc.',
    'artifact.',
    'sub.',
    'observe_agent',
    'scry_agent',
    'whisper_insight',
    'dream_sending',
    'bind_thread',
  ];

  const scopedTemplates = UNIFIED_ACTION_TEMPLATES.filter(t =>
    SCOPED_PREFIXES.some(prefix => t.id.startsWith(prefix) || t.id === prefix.replace(/\.$/, ''))
  );

  it('scoped templates include action.* and divine.* and hex.* categories', () => {
    expect(scopedTemplates.filter(t => t.id.startsWith('action.')).length).toBeGreaterThan(0);
    expect(scopedTemplates.filter(t => t.id.startsWith('divine.')).length).toBeGreaterThan(0);
    expect(scopedTemplates.filter(t => t.id.startsWith('hex.')).length).toBeGreaterThan(0);
  });

  it('every template has spellName and description (Phase 17)', () => {
    for (const t of scopedTemplates) {
      expect(t.spellName, `${t.id} missing spellName`).toBeTruthy();
      expect(t.description, `${t.id} missing description`).toBeTruthy();
    }
  });

  it('spellName is max 4 words for all scoped templates', () => {
    for (const t of scopedTemplates) {
      if (!t.spellName) continue;
      expect(t.spellName.split(/\s+/).length, `${t.id} spellName too long`).toBeLessThanOrEqual(4);
    }
  });

  it('description has no raw multi-digit numbers', () => {
    for (const t of scopedTemplates) {
      if (!t.description) continue;
      expect(t.description, `${t.id} description contains raw number`).not.toMatch(/\b\d{2,}\b/);
    }
  });

  it('migrateActionTemplate passes through spellName and description', () => {
    const templateWithMeta = ACTION_TEMPLATES.find(t => t.spellName);
    expect(templateWithMeta).toBeDefined();
    const unified = migrateActionTemplate(templateWithMeta!);
    expect(unified.spellName).toBe(templateWithMeta!.spellName);
    expect(unified.description).toBe(templateWithMeta!.description);
  });
});

describe('getUnifiedTemplateById', () => {
  it('returns template by exact id', () => {
    const first = UNIFIED_ACTION_TEMPLATES[0];
    const result = getUnifiedTemplateById(first.id);
    expect(result).toBe(first);
  });

  it('returns undefined for unknown id', () => {
    expect(getUnifiedTemplateById('nonexistent.action')).toBeUndefined();
  });
});

// ─── TB-100: rarityTier validation ───────────────────────────────

describe('rarityTier — every template has a valid tier', () => {
  const VALID_TIERS = new Set([1, 2, 3, 4]);

  it('every template has rarityTier defined', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      expect(t.rarityTier, `${t.id} missing rarityTier`).toBeDefined();
    }
  });

  it('every rarityTier is 1, 2, 3, or 4', () => {
    for (const t of UNIFIED_ACTION_TEMPLATES) {
      expect(VALID_TIERS.has(t.rarityTier), `${t.id} has invalid rarityTier: ${t.rarityTier}`).toBe(true);
    }
  });

  it('at most 16 Legendary (tier 4) templates', () => {
    // 2 divine hex legendaries + up to 1 capstone story beat per guild (10 guilds) = ~12 base,
    // + the THR-466 non-local-scale marquee branching batch (5 story_beats: cosmic Star, regional
    // Stone/Veil/Eye/Gold — each rarityTier 4) = ~17 ceiling; cap at 16 with light headroom.
    const legendaryCount = UNIFIED_ACTION_TEMPLATES.filter(t => t.rarityTier === 4).length;
    expect(legendaryCount).toBeLessThanOrEqual(16);
  });

  it('at least 50% of templates are tier 1 (Mundane)', () => {
    const tier1Count = UNIFIED_ACTION_TEMPLATES.filter(t => t.rarityTier === 1).length;
    const ratio = tier1Count / UNIFIED_ACTION_TEMPLATES.length;
    expect(ratio).toBeGreaterThanOrEqual(0.5);
  });

  it('migrateActionTemplate passes through rarityTier from ActionTemplateData', () => {
    const templateWithRarity = ACTION_TEMPLATES.find(t => t.rarityTier != null);
    expect(templateWithRarity).toBeDefined();
    const unified = migrateActionTemplate(templateWithRarity!);
    expect(unified.rarityTier).toBe(templateWithRarity!.rarityTier);
  });

  it('migrateActionTemplate defaults to tier 1 when rarityTier absent', () => {
    const templateWithout = { ...ACTION_TEMPLATES[0], id: 'test.no_rarity', rarityTier: undefined };
    const unified = migrateActionTemplate(templateWithout);
    expect(unified.rarityTier).toBe(1);
  });

  it('all encounter templates have rarityTier 1', () => {
    for (const enc of ENCOUNTER_TEMPLATES) {
      expect(enc.rarityTier).toBe(1);
    }
  });
});

// ─── Divine templates ────────────────────────────────────────────

describe('divine templates', () => {
  const divineTemplates = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('divine.'));

  it('all have scale cosmic (except self-actions which use personal)', () => {
    for (const t of divineTemplates) {
      if (t.id.startsWith('divine.self.')) continue; // personal scale by design
      // THR-773: Rekindle the Thread acts on exactly one named mortal the god is
      // bound to — `scale: 'personal'` is the design-settled scale (plan §3b), not
      // an oversight. Scale here drives the probability floor and the consequence
      // tier, and both should read this as the intimate act it is.
      if (t.id === 'divine.rekindle_thread') continue;
      expect(t.scale).toBe('cosmic');
    }
  });

  it('all have essenceCost > 0 (except self-actions which may be 0)', () => {
    for (const t of divineTemplates) {
      if (t.id.startsWith('divine.self.')) continue; // Stillness/Recede cost 0 by design
      expect(t.essenceCost).toBeDefined();
      expect(t.essenceCost!).toBeGreaterThan(0);
    }
  });

  it('all have actorAffinities containing ascendant', () => {
    for (const t of divineTemplates) {
      expect(t.actorAffinities).toContain('ascendant');
    }
  });

  it('each step onSuccess contains exactly 1 apply_influence GraphOp (original 8 interventions)', () => {
    // Perceive/Relay templates use the perceiveRelay resolver (empty onSuccess arrays).
    // Self-action templates use post-processor or update_node ops — exclude both.
    // THR-773: Rekindle the Thread carries the `quintessence_restore` op, a custom
    // graph op like the perceive/relay families above rather than a decaying
    // influence application — it writes quintessence directly and leaves a receipt.
    const interventionTemplates = divineTemplates.filter(
      t => !t.id.startsWith('divine.perceive.') &&
           !t.id.startsWith('divine.relay.') &&
           !t.id.startsWith('divine.self.') &&
           t.id !== 'divine.rekindle_thread'
    );
    for (const t of interventionTemplates) {
      for (const step of t.steps) {
        expect(step.onSuccess).toHaveLength(1);
        expect(step.onSuccess[0].op).toBe('apply_influence');
        expect(step.onSuccess[0].influence).toBeDefined();
      }
    }
  });

  it('all have 1 step with duration {min:1, max:1}', () => {
    for (const t of divineTemplates) {
      expect(t.steps).toHaveLength(1);
      expect(t.steps[0].duration).toEqual({ min: 1, max: 1 });
    }
  });

  it('covers all 8 intervention types', () => {
    const interventionTypes = divineTemplates
      .flatMap(t => t.steps)
      .flatMap(s => s.onSuccess)
      .map(op => op.influence?.interventionType)
      .filter(Boolean);
    expect(interventionTypes).toContain('dream');
    expect(interventionTypes).toContain('persuade');
    expect(interventionTypes).toContain('deceive');
    expect(interventionTypes).toContain('intimidate');
    expect(interventionTypes).toContain('inspire_intervention');
    expect(interventionTypes).toContain('coincidence');
    expect(interventionTypes).toContain('omen');
    expect(interventionTypes).toContain('afflict_bless');
  });
});

// ─── TB-046: Land & Soul hex action templates ─────────────────────

describe('TB-046 hex action templates', () => {
  const TB046_LAND_IDS = [
    'hex.raise_landmark', 'hex.dowse_resources',
    'hex.shift_season', 'hex.scorch_earth', 'hex.rend_earth',
  ];

  const TB046_SOUL_IDS = [
    'hex.attune_leyline', 'hex.forge_seer_token', 'hex.read_currents',
    'hex.shift_dominion', 'hex.amplify_flow', 'hex.sever_flow', 'hex.dispel_wild',
  ];

  const ALL_TB046_IDS = [...TB046_LAND_IDS, ...TB046_SOUL_IDS];

  it('all 12 new templates are registered', () => {
    for (const id of ALL_TB046_IDS) {
      expect(getUnifiedTemplateById(id)).toBeDefined();
    }
  });

  it('all land templates have narrativeLayer: land', () => {
    for (const id of TB046_LAND_IDS) {
      expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('land');
    }
  });

  it('all soul templates have narrativeLayer: soul', () => {
    for (const id of TB046_SOUL_IDS) {
      expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('soul');
    }
  });

  it('all target hex category', () => {
    for (const id of ALL_TB046_IDS) {
      expect(getUnifiedTemplateById(id)!.targetCategories).toContain('hex');
    }
  });

  it('all are ascendant-only', () => {
    for (const id of ALL_TB046_IDS) {
      expect(getUnifiedTemplateById(id)!.actorAffinities).toContain('ascendant');
    }
  });

  it('Create actions bypass revelation gate', () => {
    const createIds = ALL_TB046_IDS.filter(id => {
      const t = getUnifiedTemplateById(id)!;
      return t.crudType === 'create';
    });
    expect(createIds.length).toBeGreaterThan(0);
    for (const id of createIds) {
      expect(getUnifiedTemplateById(id)!.bypassRevelationGate).toBe(true);
    }
  });

  it('Find actions have crudType read', () => {
    const findIds = ['hex.dowse_resources', 'hex.read_currents'];
    for (const id of findIds) {
      expect(getUnifiedTemplateById(id)!.crudType).toBe('read');
    }
  });

  it('all have at least 1 motivation', () => {
    for (const id of ALL_TB046_IDS) {
      expect(getUnifiedTemplateById(id)!.motivations.length).toBeGreaterThan(0);
    }
  });

  it('essence costs match design doc', () => {
    expect(getUnifiedTemplateById('hex.raise_landmark')!.essenceCost).toBe(8);
    expect(getUnifiedTemplateById('hex.dowse_resources')!.essenceCost).toBe(2);
    expect(getUnifiedTemplateById('hex.shift_season')!.essenceCost).toBe(3);
    expect(getUnifiedTemplateById('hex.scorch_earth')!.essenceCost).toBe(7);
    expect(getUnifiedTemplateById('hex.rend_earth')!.essenceCost).toBe(12);
    expect(getUnifiedTemplateById('hex.attune_leyline')!.essenceCost).toBe(5);
    expect(getUnifiedTemplateById('hex.forge_seer_token')!.essenceCost).toBe(8);
    expect(getUnifiedTemplateById('hex.read_currents')!.essenceCost).toBe(3);
    expect(getUnifiedTemplateById('hex.shift_dominion')!.essenceCost).toBe(4);
    expect(getUnifiedTemplateById('hex.amplify_flow')!.essenceCost).toBe(3);
    expect(getUnifiedTemplateById('hex.sever_flow')!.essenceCost).toBe(6);
    expect(getUnifiedTemplateById('hex.dispel_wild')!.essenceCost).toBe(4);
  });
});

// ─── TB-047: People & Ruins hex action templates ──────────────────

describe('TB-047 hex action templates', () => {
  const TB047_PEOPLE_IDS = [
    'hex.send_herald', 'hex.forge_instrument', 'hex.spark_encounter',
    'hex.stir_people',
    'hex.summon_congregation', 'hex.bestow_vision',
    'hex.scatter', 'hex.smite', 'hex.incite_exodus',
  ];

  const TB047_RUINS_IDS = [
    'hex.mark_ground', 'hex.plant_dream', 'hex.read_stones',
    'hex.whisper_intuition', 'hex.consecrate_past', 'hex.restore_fragment',
    'hex.rewrite_history', 'hex.bury_past', 'hex.desecrate',
  ];

  const ALL_TB047_IDS = [...TB047_PEOPLE_IDS, ...TB047_RUINS_IDS];

  it('all 18 new templates are registered', () => {
    for (const id of ALL_TB047_IDS) {
      expect(getUnifiedTemplateById(id)).toBeDefined();
    }
  });

  it('all people templates have narrativeLayer: people', () => {
    for (const id of TB047_PEOPLE_IDS) {
      expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('people');
    }
  });

  it('all ruins templates have narrativeLayer: ruins', () => {
    for (const id of TB047_RUINS_IDS) {
      expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('ruins');
    }
  });

  it('all target hex category', () => {
    for (const id of ALL_TB047_IDS) {
      expect(getUnifiedTemplateById(id)!.targetCategories).toContain('hex');
    }
  });

  it('all are ascendant-only', () => {
    for (const id of ALL_TB047_IDS) {
      expect(getUnifiedTemplateById(id)!.actorAffinities).toContain('ascendant');
    }
  });

  it('Create actions bypass revelation gate', () => {
    const createIds = ALL_TB047_IDS.filter(id => {
      const t = getUnifiedTemplateById(id)!;
      return t.crudType === 'create';
    });
    expect(createIds.length).toBeGreaterThan(0);
    for (const id of createIds) {
      expect(getUnifiedTemplateById(id)!.bypassRevelationGate).toBe(true);
    }
  });

  it('essence costs match design doc', () => {
    expect(getUnifiedTemplateById('hex.send_herald')!.essenceCost).toBe(7);
    expect(getUnifiedTemplateById('hex.forge_instrument')!.essenceCost).toBe(10);
    expect(getUnifiedTemplateById('hex.spark_encounter')!.essenceCost).toBe(4);
    expect(getUnifiedTemplateById('hex.stir_people')!.essenceCost).toBe(3);
    expect(getUnifiedTemplateById('hex.summon_congregation')!.essenceCost).toBe(5);
    expect(getUnifiedTemplateById('hex.bestow_vision')!.essenceCost).toBe(2);
    expect(getUnifiedTemplateById('hex.scatter')!.essenceCost).toBe(5);
    expect(getUnifiedTemplateById('hex.smite')!.essenceCost).toBe(15);
    expect(getUnifiedTemplateById('hex.incite_exodus')!.essenceCost).toBe(4);
    expect(getUnifiedTemplateById('hex.mark_ground')!.essenceCost).toBe(1);
    expect(getUnifiedTemplateById('hex.plant_dream')!.essenceCost).toBe(3);
    expect(getUnifiedTemplateById('hex.read_stones')!.essenceCost).toBe(8);
    expect(getUnifiedTemplateById('hex.whisper_intuition')!.essenceCost).toBe(2);
    expect(getUnifiedTemplateById('hex.consecrate_past')!.essenceCost).toBe(5);
    expect(getUnifiedTemplateById('hex.restore_fragment')!.essenceCost).toBe(8);
    expect(getUnifiedTemplateById('hex.rewrite_history')!.essenceCost).toBe(6);
    expect(getUnifiedTemplateById('hex.bury_past')!.essenceCost).toBe(6);
    expect(getUnifiedTemplateById('hex.desecrate')!.essenceCost).toBe(4);
  });

  it('Smite is the most expensive people action', () => {
    const peopleCosts = TB047_PEOPLE_IDS.map(id => getUnifiedTemplateById(id)!.essenceCost ?? 0);
    expect(Math.max(...peopleCosts)).toBe(15); // Smite
  });
});

// ─── TB-048: Control (sustained) hex action templates ─────────────

describe('TB-048 control templates', () => {
  const TB048_LAND_IDS = ['hex.claim_dominion', 'hex.cultivate', 'hex.claim_resource'];
  const TB048_SOUL_IDS = ['hex.anchor_sphere', 'hex.tap_source', 'hex.attune_thread', 'hex.channel_current'];
  const TB048_PEOPLE_IDS = ['hex.shepherd_flock', 'hex.install_champion', 'hex.strengthen_thread', 'hex.impose_decree'];
  const TB048_RUINS_IDS = ['hex.bind_echoes', 'hex.compel_exploration', 'hex.seal_tomb', 'hex.ward_against_deep'];
  const ALL_TB048_IDS = [...TB048_LAND_IDS, ...TB048_SOUL_IDS, ...TB048_PEOPLE_IDS, ...TB048_RUINS_IDS];

  it('all 15 control templates are registered', () => {
    for (const id of ALL_TB048_IDS) {
      expect(getUnifiedTemplateById(id)).toBeDefined();
    }
  });

  it('all have durationMode sustained', () => {
    for (const id of ALL_TB048_IDS) {
      expect(getUnifiedTemplateById(id)!.durationMode).toBe('sustained');
    }
  });

  it('all have controlSpec with perTickCost', () => {
    for (const id of ALL_TB048_IDS) {
      const t = getUnifiedTemplateById(id)!;
      expect(t.controlSpec).toBeDefined();
      expect(Object.keys(t.controlSpec!.perTickCost).length).toBeGreaterThan(0);
    }
  });

  it('all have controlSpec.narrativeTemplates with required fields', () => {
    for (const id of ALL_TB048_IDS) {
      const nt = getUnifiedTemplateById(id)!.controlSpec!.narrativeTemplates;
      expect(nt.established).toBeTruthy();
      expect(nt.active).toBeTruthy();
      expect(nt.lapsed).toBeTruthy();
    }
  });

  it('all have contestPrerequisites with at least one path', () => {
    for (const id of ALL_TB048_IDS) {
      const prereqs = getUnifiedTemplateById(id)!.controlSpec!.contestPrerequisites;
      expect(prereqs).toBeDefined();
      expect(prereqs!.usurp || prereqs!.destroy).toBeDefined();
    }
  });

  it('income-generating effects have perTickIncome', () => {
    const incomeEffects = ['hex.tap_source', 'hex.claim_resource'];
    for (const id of incomeEffects) {
      const spec = getUnifiedTemplateById(id)!.controlSpec!;
      expect(spec.perTickIncome).toBeDefined();
      const totalIncome = Object.values(spec.perTickIncome!).reduce((a, b) => a + b, 0);
      expect(totalIncome).toBeGreaterThan(0);
    }
  });

  it('Tap the Source generates net positive income', () => {
    const spec = getUnifiedTemplateById('hex.tap_source')!.controlSpec!;
    const totalCost = Object.values(spec.perTickCost).reduce((a, b) => a + b, 0);
    const totalIncome = Object.values(spec.perTickIncome!).reduce((a, b) => a + b, 0);
    expect(totalIncome).toBeGreaterThan(totalCost);
  });

  it('layer assignments are correct', () => {
    for (const id of TB048_LAND_IDS) expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('land');
    for (const id of TB048_SOUL_IDS) expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('soul');
    for (const id of TB048_PEOPLE_IDS) expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('people');
    for (const id of TB048_RUINS_IDS) expect(getUnifiedTemplateById(id)!.narrativeLayer).toBe('ruins');
  });

  it('all target hex category', () => {
    for (const id of ALL_TB048_IDS) {
      expect(getUnifiedTemplateById(id)!.targetCategories).toContain('hex');
    }
  });

  it('all are ascendant-only', () => {
    for (const id of ALL_TB048_IDS) {
      expect(getUnifiedTemplateById(id)!.actorAffinities).toContain('ascendant');
    }
  });
});

describe('THR-1078: authoring metadata never reaches a player-facing prose field', () => {
  /**
   * `description` is player-facing by contract — the encounter stage renders it as
   * `header.subtitle` (buildUnifiedEncounterStageModel), and the Codex renders it as
   * an entry `summary`. All eight vertical-slice templates shipped authoring notes in
   * it instead: a hook number, a Linear id, and — on three of them — the name of the
   * follow-on the player had not yet chosen.
   *
   * The guard is pool-wide rather than slice-scoped on purpose: the defect was a
   * habit of authoring, not a property of one file, so the predicate is "any template's
   * player-facing prose", per the ticket's own membership rule.
   *
   * `technicalEffect` is deliberately NOT checked. It is wiki-facing by contract
   * (types/unifiedAction.ts: "wiki-facing register", sourced from resolving code) and
   * legitimately cites ticket ids — action-technical-effects.ts names THR-605 on the
   * artifact verbs. Including it here would fail on correct content.
   */
  const AUTHORING_METADATA = [
    { label: 'hook number', pattern: /Hook #\d+/ },
    { label: 'Linear issue id', pattern: /THR-\d+/ },
    { label: 'authoring-batch marker', pattern: /Vertical-slice encounter/i },
  ];

  /** Player-facing prose fields, as rendered by the encounter stage and the Codex. */
  function playerFacingProse(t: UnifiedActionTemplate): Array<{ field: string; text: string }> {
    const entries: Array<{ field: string; text: string }> = [];
    if (t.description) entries.push({ field: 'description', text: t.description });
    const n = t.narrativeTemplates;
    if (n?.initiation) entries.push({ field: 'narrativeTemplates.initiation', text: n.initiation });
    if (n?.success) entries.push({ field: 'narrativeTemplates.success', text: n.success });
    if (n?.failure) entries.push({ field: 'narrativeTemplates.failure', text: n.failure });
    return entries;
  }

  it('the population under test is non-empty', () => {
    // Guards against the vacuous-pass shape: a filter that silently matches nothing
    // makes every assertion below trivially true.
    const withDescription = UNIFIED_ACTION_TEMPLATES.filter(t => Boolean(t.description));
    expect(UNIFIED_ACTION_TEMPLATES.length).toBeGreaterThan(0);
    expect(withDescription.length).toBeGreaterThan(0);
  });

  it('no template carries authoring metadata in player-facing prose', () => {
    const offenders: string[] = [];

    for (const template of UNIFIED_ACTION_TEMPLATES) {
      for (const { field, text } of playerFacingProse(template)) {
        for (const { label, pattern } of AUTHORING_METADATA) {
          const match = text.match(pattern);
          if (match) {
            // Report the matched token, not the head of the string — the metadata is
            // usually appended at the tail, so a leading slice hides the actual offender.
            offenders.push(`${template.id} · ${field} · ${label} · "${match[0]}"`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('the eight vertical-slice templates still author a description', () => {
    // The fix was to rewrite these strings, not to delete them — a blank subtitle
    // would be a different regression on the same surface.
    const slice = UNIFIED_ACTION_TEMPLATES.filter(t => t.id.startsWith('encounter.slice.'));
    expect(slice.length).toBe(8);
    for (const t of slice) {
      expect(t.description, `${t.id} lost its description`).toBeTruthy();
    }
  });
});
