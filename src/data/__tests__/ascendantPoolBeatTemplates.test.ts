import { describe, it, expect } from 'vitest';
import { ASCENDANT_POOL_BEAT_TEMPLATES } from '../ascendant-pool-beat-templates';
import {
  ASCENDANT_BEAT_POOL,
  ASCENDANT_SPINE,
} from '../ascendant-beat-content';
import {
  getUnifiedTemplateById,
  UNIFIED_ACTION_TEMPLATES,
} from '../unified-action-templates';
import { WorldGraph } from '../../engine/graph';
import { gatherNarrativeContext, enrichProse } from '../../engine/proseEnrichment';
import type { GameState } from '../../types/gameState';

const POOL_TEMPLATE_IDS = new Set(ASCENDANT_POOL_BEAT_TEMPLATES.map(t => t.id));

describe('Ascendant pool-beat content templates (THR-514)', () => {
  it('every pool beat sets templateId === beatId', () => {
    for (const beat of ASCENDANT_BEAT_POOL) {
      expect(beat.templateId, `pool beat ${beat.beatId} missing templateId`).toBe(beat.beatId);
    }
  });

  it('every pool beat templateId resolves via getUnifiedTemplateById', () => {
    // This is the contract resolvePendingBeat's templateResolver relies on — a beat whose
    // templateId fails resolution is skipped as missing_template (THR-517 fail-soft).
    for (const beat of ASCENDANT_BEAT_POOL) {
      const tmpl = getUnifiedTemplateById(beat.templateId!);
      expect(tmpl, `templateId ${beat.templateId} has no template`).toBeDefined();
      expect(tmpl!.id).toBe(beat.templateId);
    }
  });

  it('ships exactly one content template per pool beat, ids matching', () => {
    expect(ASCENDANT_POOL_BEAT_TEMPLATES.length).toBe(ASCENDANT_BEAT_POOL.length);
    const beatIds = new Set(ASCENDANT_BEAT_POOL.map(b => b.beatId));
    for (const t of ASCENDANT_POOL_BEAT_TEMPLATES) {
      expect(beatIds.has(t.id), `template ${t.id} has no matching pool beat`).toBe(true);
    }
  });

  it('pool-beat templates are NOT in UNIFIED_ACTION_TEMPLATES (no hand/codex leak)', () => {
    // They resolve via getUnifiedTemplateById's third lookup but must never appear as
    // castable cards: phaseAscendantHandFilter / Codex / CMS all read UNIFIED_ACTION_TEMPLATES.
    const unifiedIds = new Set(UNIFIED_ACTION_TEMPLATES.map(t => t.id));
    for (const id of POOL_TEMPLATE_IDS) {
      expect(unifiedIds.has(id), `pool template ${id} leaked into UNIFIED_ACTION_TEMPLATES`).toBe(false);
    }
  });

  it('no template carries an ascendant affinity (cannot surface in the ascendant hand)', () => {
    for (const t of ASCENDANT_POOL_BEAT_TEMPLATES) {
      expect(t.actorAffinities).not.toContain('ascendant');
    }
  });

  it('every template has a non-empty enrichable description body', () => {
    for (const t of ASCENDANT_POOL_BEAT_TEMPLATES) {
      expect(t.description, `template ${t.id} missing description`).toBeTruthy();
      expect((t.description ?? '').length).toBeGreaterThan(40);
    }
  });

  it('beat ids do not collide with the scripted spine', () => {
    const spineIds = new Set(ASCENDANT_SPINE.map(b => b.beatId));
    for (const id of POOL_TEMPLATE_IDS) {
      expect(spineIds.has(id), `pool template ${id} collides with a spine beat`).toBe(false);
    }
  });

  it('enrichProse resolves every placeholder against a run subject (no raw tokens leak)', () => {
    // Build the minimal world GameView's beatProseOverride enriches against: an ascendant
    // threaded to one mortal (The First). enrichProse must leave no `{placeholder}` behind.
    const g = new WorldGraph();
    g.addNode({ id: 'asc-1', type: 'actor', name: 'God', properties: { actorType: 'ascendant' } });
    g.addNode({ id: 'kael', type: 'actor', name: 'Kael Thornweaver', properties: { actorType: 'individual', gender: 'male' } });
    g.addEdge({ id: 'thread-1', source: 'asc-1', target: 'kael', type: 'thread', properties: { courtPosition: 'the_first' } });
    const state = { tick: 30, seed: 42, ascendantId: 'asc-1', graph: g } as unknown as GameState;
    const ctx = gatherNarrativeContext(g, 'kael', undefined, undefined, null, state, 30);

    for (const t of ASCENDANT_POOL_BEAT_TEMPLATES) {
      const title = enrichProse(t.name, ctx);
      const body = enrichProse(t.description ?? '', ctx);
      expect(title, `title for ${t.id} leaked a placeholder`).not.toMatch(/\{[^}]+\}/);
      expect(body, `body for ${t.id} leaked a placeholder`).not.toMatch(/\{[^}]+\}/);
      // The First's name actually lands in bodies that use {name}.
      if ((t.description ?? '').includes('{name}')) {
        expect(body).toContain('Kael Thornweaver');
      }
    }
  });
});
