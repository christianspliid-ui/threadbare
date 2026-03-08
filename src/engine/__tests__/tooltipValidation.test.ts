/**
 * Tooltip Content Validation Tests
 *
 * Validates that all {{concept.id}} cross-references in tooltip descriptions
 * resolve correctly. This catches broken links when content packages change.
 */

import { describe, it, expect } from 'vitest';
import { resolveTooltip } from '../tooltipResolver';
import { UI_TOOLTIPS } from '../../data/ui-content';
import { TOOLTIP_LINK_PATTERN } from '../../types/tooltip';

describe('tooltip content validation', () => {
  /**
   * Test 1: All {{concept.id}} references in UI_TOOLTIPS descriptions
   * must resolve to valid tooltips via resolveTooltip().
   */
  it('all {{concept.id}} references in UI_TOOLTIPS resolve to valid tooltips', () => {
    const brokenLinks: string[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;

      // Extract all {{concept.id}} markers from description
      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        const linkedId = match[1];
        const resolved = resolveTooltip(linkedId);

        if (!resolved) {
          brokenLinks.push(`${key} → {{${linkedId}}}`);
        }
      }
    }

    expect(
      brokenLinks.length,
      brokenLinks.length > 0 ? `Broken tooltip links:\n${brokenLinks.join('\n')}` : ''
    ).toBe(0);
  });

  /**
   * Test 2: All resolvable tooltips in the test suite must have non-empty labels.
   * This ensures resolved content is displayable.
   */
  it('all resolvable tooltips have non-empty labels', () => {
    const testIds = [
      // UI tooltips
      'ui.doom_bar',
      'ui.essence_panel',
      'ui.mandate_tracker',
      'ui.avatar_move',
      'ui.avatar_wheel',
      'ui.avatar_scry',
      'ui.sim_play_pause',
      'ui.sim_speed',
      'ui.rival_panel',
      'ui.retinue_panel',
      'ui.debug_panel',
      // Foundation spheres
      'sphere.chaos',
      'sphere.order',
      'sphere.light',
      'sphere.darkness',
      // Creation spheres (sampled)
      'sphere.force',
      'sphere.entropy',
      'sphere.mind',
      // Doom concepts
      'doom.unmaking',
      'doom.clock',
    ];

    const emptyLabels: string[] = [];
    for (const id of testIds) {
      const result = resolveTooltip(id);
      if (result && !result.label?.trim()) {
        emptyLabels.push(`${id}: empty label`);
      }
    }

    expect(
      emptyLabels.length,
      emptyLabels.length > 0 ? `Empty labels:\n${emptyLabels.join('\n')}` : ''
    ).toBe(0);
  });

  /**
   * Test 3: No UI tooltip description should exceed 200 characters.
   * This is a UI width constraint — longer descriptions must be condensed.
   */
  it('no UI tooltip description exceeds 200 characters', () => {
    const longDescs: string[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (entry.desc && entry.desc.length > 200) {
        longDescs.push(`${key}: ${entry.desc.length} chars`);
      }
    }

    expect(
      longDescs.length,
      longDescs.length > 0 ? `Descriptions too long:\n${longDescs.join('\n')}` : ''
    ).toBe(0);
  });

  /**
   * Test 4: All UI tooltips must have both label and at least one of label/desc.
   * Ensures no empty or undefined tooltips slip through.
   */
  it('all UI tooltips have required fields', () => {
    const incomplete: string[] = [];

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.label?.trim()) {
        incomplete.push(`${key}: missing or empty label`);
      }
      if (!entry.label && !entry.desc) {
        incomplete.push(`${key}: has neither label nor description`);
      }
    }

    expect(
      incomplete.length,
      incomplete.length > 0 ? `Incomplete tooltips:\n${incomplete.join('\n')}` : ''
    ).toBe(0);
  });

  /**
   * Test 5: No {{concept.id}} references should reference unimplemented prefixes.
   * This catches typos like {{mandate.foo}} before they become silent failures.
   */
  it('no {{concept.id}} references use unimplemented prefixes', () => {
    const invalidPrefixes: string[] = [];
    const validPrefixes = new Set([
      'ui',
      'sphere',
      'reach',
      'terrain',
      'archetype',
      'doom',
      'mandate', // Explicitly allowed even though not yet resolved
    ]);

    for (const [key, entry] of Object.entries(UI_TOOLTIPS)) {
      if (!entry.desc) continue;

      const matches = [...entry.desc.matchAll(TOOLTIP_LINK_PATTERN)];
      for (const match of matches) {
        const linkedId = match[1];
        const prefix = linkedId.split('.')[0];

        if (!validPrefixes.has(prefix)) {
          invalidPrefixes.push(`${key} → {{${linkedId}}}: unknown prefix "${prefix}"`);
        }
      }
    }

    expect(
      invalidPrefixes.length,
      invalidPrefixes.length > 0 ? `Invalid prefixes:\n${invalidPrefixes.join('\n')}` : ''
    ).toBe(0);
  });
});
