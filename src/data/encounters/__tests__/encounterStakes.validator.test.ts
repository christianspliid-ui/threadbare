/**
 * Encounter stakes validator — THR-1727, **required mode** since THR-1728.
 *
 * The stakes line only holds its shape if every template's parts read in the
 * slots the formula gives them (`[actor] must [goal] — or [risk].`, `[actor]
 * [won].`). This suite:
 *
 * 1. **fails** on malformed `stakes` anywhere in the predicate (shape, case,
 *    punctuation, caps, forbidden words, raw tokens, a missing `lostBadly` where
 *    the template authors a distinct critical-failure ending, missing `arms`
 *    where fork arms end differently);
 * 2. **fails** when a template in the predicate authors no `stakes` (THR-1728
 *    drained the backlog and flipped this from report mode). Without stakes the
 *    veil falls back to the scene's opening prose; the designer-voice
 *    `description` never reaches it.
 *
 * **Membership predicate** (THR-688 rule A, computed, never a snapshot count):
 * every template in the unified registry, the exploration encounter list or the
 * location-branching list that `isEncounterAction` classifies as an encounter or
 * whose id is `encounter.*` (`check:encounter --all`'s population), plus every
 * encounter-shaped registry member (`isEncounterShapedTemplate`) — i.e. every
 * template that can open on the encounter veil from those registries. The rules
 * themselves live in `content-eval/encounterStakesRules.ts`, shared with the
 * Composition Contract's `stakes` block.
 * Asserted on the **shipped** object (`getUnifiedTemplateById`), so a converter
 * that drops the field fails here rather than in a playtest.
 */

import { describe, expect, it } from 'vitest';
import {
  getUnifiedTemplateById,
  isEncounterShapedTemplate,
  LOCATION_BRANCHING_ENCOUNTER_TEMPLATES,
  UNIFIED_ACTION_TEMPLATES,
} from '../../unified-action-templates';
import { ENCOUNTER_TEMPLATES } from '../../encounter-content';
import { isEncounterAction } from '../../../engine/chapterArchive';
import { SLICE_TEMPLATE_IDS } from '../vertical-slice';
import { STAKES_RISK_MAX_CHARS } from '../../nudge-stage-content';
import { encounterStakesProblems, stakesProblems } from '../../content-eval/encounterStakesRules';
import type { UnifiedActionTemplate } from '../../../types/unifiedAction';
import type { EncounterStakes } from '../../../types/encounterStakes';

function templatesInPredicate(): UnifiedActionTemplate[] {
  const byId = new Map<string, UnifiedActionTemplate>();
  for (const t of [...UNIFIED_ACTION_TEMPLATES, ...ENCOUNTER_TEMPLATES, ...LOCATION_BRANCHING_ENCOUNTER_TEMPLATES]) {
    // THR-1728: plus every `encounter.*` id (`check:encounter --all`'s population)
    // and every encounter-shaped registry member — a scene a mortal walks into, which
    // opens on the veil when a threaded mortal runs it (guild quests, tavern, social,
    // faction scenes). Only the verbs stay out: `action.*` / `npc_*` and anything
    // ascendant-castable (`isEncounterShapedTemplate`, THR-1635).
    const inPredicate = isEncounterAction(t.id) || t.id.startsWith('encounter.') || isEncounterShapedTemplate(t);
    if (byId.has(t.id) || !inPredicate) continue;
    byId.set(t.id, getUnifiedTemplateById(t.id) ?? t);
  }
  return [...byId.values()];
}

describe('THR-1727 · encounter stakes validator (required mode, THR-1728)', () => {
  const templates = templatesInPredicate();

  it('the predicate is computed and non-trivial', () => {
    expect(templates.length).toBeGreaterThan(Object.keys(SLICE_TEMPLATE_IDS).length);
  });

  it('every authored stakes block is well formed', () => {
    const problems: string[] = [];
    for (const t of templates) {
      if (!t.stakes) continue;
      for (const p of stakesProblems(t, t.stakes)) problems.push(`${t.id}: ${p}`);
    }
    expect(problems).toEqual([]);
  });

  it('the five slice encounters ship stakes (through the registry, not the literal)', () => {
    for (const id of [
      SLICE_TEMPLATE_IDS.bridge,
      SLICE_TEMPLATE_IDS.pass,
      SLICE_TEMPLATE_IDS.caravan,
      SLICE_TEMPLATE_IDS.crossroads,
      SLICE_TEMPLATE_IDS.family,
    ]) {
      expect(getUnifiedTemplateById(id)?.stakes, id).toBeDefined();
      expect(templates.some(t => t.id === id), `${id} is outside the predicate`).toBe(true);
    }
  });

  it('every template in the predicate authors stakes (THR-1728 required mode)', () => {
    // The same predicate `check:encounter` gates on (Composition Contract `stakes` block).
    const missing = templates
      .filter(t => !t.stakes)
      .map(t => `${t.id}: ${encounterStakesProblems(t).join('; ')}`)
      .sort();
    expect(missing, 'encounter templates without stakes (see Docs/plans/2026-10-04-thr-1727-encounter-stakes-line.md § Content pillar)').toEqual([]);
  });

  // The validator's own falsification twin: a malformed block must be caught.
  it('catches a malformed block', () => {
    const bad: EncounterStakes = {
      goal: 'Cross the bridge.',
      risk: 'let the traveler fall {cast:keeper}',
      won: 'crossed',
      lost: 'x'.repeat(STAKES_RISK_MAX_CHARS + 1),
    };
    const bridge = getUnifiedTemplateById(SLICE_TEMPLATE_IDS.bridge)!;
    const problems = stakesProblems(bridge, bad);
    expect(problems.join('\n')).toMatch(/goal starts with a capital/);
    expect(problems.join('\n')).toMatch(/goal ends in punctuation/);
    expect(problems.join('\n')).toMatch(/risk carries a raw token/);
    expect(problems.join('\n')).toMatch(/risk uses forbidden word "traveler"/);
    expect(problems.join('\n')).toMatch(/lost is \d+ chars/);
    expect(problems.join('\n')).toMatch(/lostBadly missing/);

    const family = getUnifiedTemplateById(SLICE_TEMPLATE_IDS.family)!;
    expect(stakesProblems(family, { ...family.stakes!, arms: undefined }).join('\n')).toMatch(/arms missing/);
    expect(stakesProblems(family, { ...family.stakes!, arms: { sideways: { won: 'went sideways' } } }).join('\n'))
      .toMatch(/arms\.sideways names no fork arm/);
  });
});
